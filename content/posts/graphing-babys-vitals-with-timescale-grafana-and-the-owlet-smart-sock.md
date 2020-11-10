---
title: "Graphing Baby's Vitals With Timescale, Grafana and the Owlet Smart Sock"
date: 2020-11-09T17:37:00-06:00
tags: ["grafana", "postgres", "timescaledb", "owlet", "smart", "sock"]
---

## Goal

Monitor your newborn's heart rate, O2 levels and more in Grafana!

![newborn vitals in grafana](/images/newborn-vitals-grafana.png)

Note: some of the graphs (particulate, temp, etc are from a [Pimoroni Enviro+](https://shop.pimoroni.com/products/enviro?variant=31155658457171), not the sock)

<br />

## Parts Required

![You need a server, a baby and the owlet smart sock](/images/parts-required.png)

* **server**: don't need anything extravagant -- a Raspberry Pi 4 can easily handle the python scraper, grafana and postgres. I used the default, 32-bit Raspbian OS with the Desktop environment.

* **baby**: put sock on baby

* **sock**: tested with the Gen3 Owlet Smart Sock. The python scraper will not work with Gen1 and Gen2 Owlet socks.

<br />

## Server Setup

Install grafana

{{< highlight bash >}}
# add grafana to sources.list
$ sudo apt-get install -y apt-transport-https
$ sudo apt-get install -y software-properties-common wget
$ wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -

# if apt-key add fails, try installing gnupg2 and rerunning apt-key add
$ sudo apt-get install -y gnupg2

# install grafana
$ sudo apt-get update
$ sudo apt-get install grafana
{{< / highlight >}}

Install postgres 11 and timescaledb

{{< highlight bash >}}
# install postgres
$ sudo apt-get install -y postgresql

# add timescale to sources.list
$ sudo sh -c "echo 'deb https://packagecloud.io/timescale/timescaledb/debian/ `lsb_release -c -s` main' > /etc/apt/sources.list.d/timescaledb.list"
$ wget --quiet -O - https://packagecloud.io/timescale/timescaledb/gpgkey | sudo apt-key add -
$ sudo apt-get update

# install timescale
$ sudo apt-get install timescaledb-postgresql-11

# optional: tune timescale
$ sudo timescaledb-tune

# restart postgresql with timescaledb now available
$ sudo service postgresql restart
{{< / highlight >}}

Make a postgres user to insert values from the Owlet API into your database.

For convenience, I'm granting `SUPERUSER`, but you will want to scope the role better down the road.

{{< highlight bash >}}
# switch to postgres user and login to postgres
$ su -- postgres
$ psql
{{< / highlight >}}

{{< highlight sql >}}
CREATE USER userA WITH PASSWORD 'password';

ALTER ROLE userA WITH SUPERUSER;
{{< / highlight >}}

Create a database for Owlet data to live in

{{< highlight sql >}}
CREATE DATABASE metrics;

\c metrics

CREATE TABLE owlet (
  time  TIMESTAMPTZ       NOT NULL,
  ox    DOUBLE PRECISION  NULL,
  hr    DOUBLE PRECISION  NULL,
  mv    DOUBLE PRECISION  NULL,
  sc    DOUBLE PRECISION  NULL,
  st    DOUBLE PRECISION  NULL,
  bso   DOUBLE PRECISION  NULL,
  bat   DOUBLE PRECISION  NULL,
  btt   DOUBLE PRECISION  NULL,
  chg   DOUBLE PRECISION  NULL,
  aps   DOUBLE PRECISION  NULL,
  alrt  DOUBLE PRECISION  NULL,
  ota   DOUBLE PRECISION  NULL,
  srf   DOUBLE PRECISION  NULL,
  rsi   DOUBLE PRECISION  NULL
);

-- enable timescaledb extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- enable timescaledb on the table
SELECT create_hypertable('owlet', 'time', migrate_data => TRUE);
{{< / highlight >}}

Make sure all the Python things are installed, and the `psycopg2` driver to send Owlet API scraper data to postgres

{{< highlight bash >}}
$ sudo apt-get install -y python3 python3-pip

$ python3 -m pip install psycopg2-binary
{{< / highlight >}}

Finally, create the Owlet python script
{{< highlight python >}}
#!/usr/bin/python3

import sys, os, time, requests, json
import psycopg2

sess = None
url_props = None
url_activate = None
#headers = {'Content-Type' : 'application/json', 'Accept' : 'application/json'}
headers = {}
auth_token = None
expire_time = 0
dsn = None
owlet_region = 'world'
region_config = {
    'world': {
        'url_mini': 'https://ayla-sso.owletdata.com/mini/',
        'url_signin': 'https://user-field-1a2039d9.aylanetworks.com/api/v1/token_sign_in',
        'url_base': 'https://ads-field-1a2039d9.aylanetworks.com/apiv1',
        'apiKey': 'AIzaSyCsDZ8kWxQuLJAMVnmEhEkayH1TSxKXfGA',
        'app_id': 'sso-prod-3g-id',
        'app_secret': 'sso-prod-UEjtnPCtFfjdwIwxqnC0OipxRFU',
    },
    'europe': {
        'url_mini': 'https://ayla-sso.eu.owletdata.com/mini/',
        'url_signin': 'https://user-field-eu-1a2039d9.aylanetworks.com/api/v1/token_sign_in',
        'url_base': 'https://ads-field-eu-1a2039d9.aylanetworks.com/apiv1',
        'apiKey': 'AIzaSyDm6EhV70wudwN3iOSq3vTjtsdGjdFLuuM',
        'app_id': 'OwletCare-Android-EU-fw-id',
        'app_secret': 'OwletCare-Android-EU-JKupMPBoj_Npce_9a95Pc8Qo0Mw',
    }
}

class FatalError(Exception):
    pass

def log(s):
    sys.stderr.write(s + '\n')
    sys.stderr.flush()

def record(s):
    sys.stdout.write(s + '\n')
    sys.stdout.flush()

def login():
    global auth_token, expire_time, owlet_region
    try:
        owlet_user, owlet_pass = os.environ['OWLET_USER'], os.environ['OWLET_PASS']
        if not len(owlet_user):
            raise FatalError("OWLET_USER is empty")
        if not len(owlet_pass):
            raise FatalError("OWLET_PASS is empty")
    except KeyError as e:
        raise FatalError("OWLET_USER or OWLET_PASS env var is not defined")
    if 'OWLET_REGION' in os.environ:
        owlet_region = os.environ['OWLET_REGION']
    if owlet_region not in region_config:
        raise FatalError("OWLET_REGION env var '{}' not recognised - must be one of {}".format(
            owlet_region, region_config.keys()))
    if auth_token is not None and (expire_time > time.time()):
        return
    log('Logging in')
    # authenticate against Firebase, get the JWT.
    # need to pass the X-Android-Package and X-Android-Cert headers because
    # the API key is restricted to the Owlet Android app
    # https://cloud.google.com/docs/authentication/api-keys#api_key_restrictions
    api_key = region_config[owlet_region]['apiKey']
    r = requests.post(f'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key={api_key}',
            data=json.dumps({'email': owlet_user, 'password': owlet_pass, 'returnSecureToken': True}),
            headers={
                'X-Android-Package': 'com.owletcare.owletcare',
                'X-Android-Cert': '2A3BC26DB0B8B0792DBE28E6FFDC2598F9B12B74'
        })
    r.raise_for_status()
    jwt = r.json()['idToken']
    # authenticate against owletdata.com, get the mini_token
    r = requests.get(region_config[owlet_region]
                     ['url_mini'], headers={'Authorization': jwt})
    r.raise_for_status()
    mini_token = r.json()['mini_token']
    # authenticate against Ayla, get the access_token
    r = requests.post(region_config[owlet_region]['url_signin'], json={
                "app_id": region_config[owlet_region]['app_id'],
                "app_secret": region_config[owlet_region]['app_secret'],
                "provider": "owl_id",
                "token": mini_token,
                })
    r.raise_for_status()
    auth_token = r.json()['access_token']
    # we will re-auth 60 seconds before the token expires
    expire_time = time.time() + r.json()['expires_in'] - 60
    headers['Authorization'] = 'auth_token ' + auth_token
    log('Auth token %s' % auth_token)

def fetch_dsn():
    global dsn, url_props, url_activate
    if dsn is None:
        log('Getting DSN')
        r = sess.get(region_config[owlet_region]
                     ['url_base'] + '/devices.json', headers=headers)
        r.raise_for_status()
        devs = r.json()
        if len(devs) < 1:
            raise FatalError('Found zero Owlet monitors')
        # Allow for multiple devices
        dsn = []
        url_props = []
        url_activate = []
        for device in devs:
            device_sn = device['device']['dsn']
            dsn.append(device_sn)
            log('Found Owlet monitor device serial number %s' % device_sn)
            url_props.append(
                region_config[owlet_region]['url_base'] + '/dsns/' + device_sn
                + '/properties.json'
            )
            url_activate.append(
                region_config[owlet_region]['url_base'] + '/dsns/' + device_sn
                + '/properties/APP_ACTIVE/datapoints.json'
            )

def reactivate(url_activate):
    payload = { "datapoint": { "metadata": {}, "value": 1 } }
    r = sess.post(url_activate, json=payload, headers=headers)
    r.raise_for_status()

def fetch_props():
    # Ayla cloud API data is updated only when APP_ACTIVE periodically reset to 1.
    my_props = []
    # Get properties for each device; note no pause between requests for each device
    for device_sn,next_url_activate,next_url_props in zip(dsn,url_activate,url_props):
        reactivate(next_url_activate)
        device_props = {'DSN':device_sn}
        r = sess.get(next_url_props, headers=headers)
        r.raise_for_status()
        props = r.json()
        for prop in props:
            n = prop['property']['name']
            del(prop['property']['name'])
            device_props[n] = prop['property']
        my_props.append(device_props)
    return my_props

def record_vitals(p):
    device_sn = p['DSN']
    vitals = json.loads(p['REAL_TIME_VITALS']['value'])
    try:
        db_user, db_pass, db_name, db_host = os.environ['DB_USER'], os.environ['DB_PASS'], os.environ['DB_NAME'], os.environ['DB_HOST']
        conn = psycopg2.connect(f"host='{db_host}' dbname='{db_name}' user='{db_user}' password='{db_pass}'")
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO owlet VALUES (NOW(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (vitals['ox'], vitals['hr'], vitals['mv'], vitals['sc'], vitals['st'], vitals['bso'], vitals['bat'], vitals['btt'], vitals['chg'], vitals['aps'], vitals['alrt'], vitals['ota'], vitals['srf'], vitals['rsi']))
            conn.commit()
    except Exception as e:
        print(e)


def loop():
    global sess
    sess = requests.session()
    while True:
        try:
            login()
            fetch_dsn()
            for prop in fetch_props():
                record_vitals(prop)
            time.sleep(10)
        except requests.exceptions.RequestException as e:
            log('Network error: %s' % e)
            time.sleep(1)
            sess = requests.session()

def main():
    try:
        loop()
    except FatalError as e:
        sys.stderr.write('%s\n' % e)
        sys.exit(1)

if __name__ == "__main__":
    main()
{{< / highlight >}}

<br />

> Note: All credit for this script is due [mbevand](https://github.com/mbevand) and [their script](https://github.com/mbevand/owlet_monitor) -- I simply added the `record_vitals` postgres logic. [mbevand](https://github.com/mbevand) decompiled the Owlet Android APK and found the right API keys to make auth work. I am very grateful!

Run the python script to start recording to postgres!

{{< highlight bash >}}
DB_USER='userA' \
DB_PASS='password' \
DB_HOST='put postgres ip here' \
DB_NAME='metrics' \
OWLET_USER='email used to login to Owlet' \
OWLET_PASS='password to login to owlet' \
python3 owlet.py
{{< / highlight >}}

<br />

## Grafana Setup

For info on connecting postgres/timescaledb to Grafana, check out https://docs.timescale.com/latest/getting-started/installation-grafana

Here's an importable Grafana dashboard to get started

![asdf](/images/newborn-vitals-grafana-subset.png)

And the code

{{< highlight json >}}
{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": "-- Grafana --",
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts",
        "type": "dashboard"
      }
    ]
  },
  "editable": true,
  "gnetId": null,
  "graphTooltip": 0,
  "id": 1,
  "links": [],
  "panels": [
    {
      "aliasColors": {},
      "bars": true,
      "dashLength": 10,
      "dashes": false,
      "datasource": null,
      "fieldConfig": {
        "defaults": {
          "custom": {}
        },
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 6,
        "w": 8,
        "x": 0,
        "y": 0
      },
      "hiddenSeries": false,
      "id": 2,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": false,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "alertThreshold": true
      },
      "percentage": false,
      "pluginVersion": "7.3.1",
      "pointradius": 0.5,
      "points": true,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "format": "time_series",
          "group": [],
          "metricColumn": "none",
          "rawQuery": false,
          "rawSql": "SELECT\n  \"time\" AS \"time\",\n  hr\nFROM owlet\nWHERE\n  $__timeFilter(\"time\")\nORDER BY 1",
          "refId": "A",
          "select": [
            [
              {
                "params": [
                  "hr"
                ],
                "type": "column"
              }
            ]
          ],
          "table": "owlet",
          "timeColumn": "\"time\"",
          "timeColumnType": "timestamptz",
          "where": [
            {
              "name": "$__timeFilter",
              "params": [],
              "type": "macro"
            }
          ]
        }
      ],
      "thresholds": [
        {
          "colorMode": "critical",
          "fill": true,
          "line": true,
          "op": "gt",
          "value": 220,
          "yaxis": "left"
        },
        {
          "colorMode": "critical",
          "fill": true,
          "line": true,
          "op": "lt",
          "value": 60,
          "yaxis": "left"
        }
      ],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "Baby's Heart Rate",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "bpm",
          "label": null,
          "logBase": 1,
          "max": "230",
          "min": "50",
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    },
    {
      "aliasColors": {},
      "bars": true,
      "dashLength": 10,
      "dashes": false,
      "datasource": null,
      "fieldConfig": {
        "defaults": {
          "custom": {}
        },
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 6,
        "w": 8,
        "x": 8,
        "y": 0
      },
      "hiddenSeries": false,
      "id": 4,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": false,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "alertThreshold": true
      },
      "percentage": false,
      "pluginVersion": "7.3.1",
      "pointradius": 0.5,
      "points": true,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "format": "time_series",
          "group": [],
          "metricColumn": "none",
          "rawQuery": false,
          "rawSql": "SELECT\n  \"time\" AS \"time\",\n  ox\nFROM owlet\nWHERE\n  $__timeFilter(\"time\")\nORDER BY 1",
          "refId": "A",
          "select": [
            [
              {
                "params": [
                  "ox"
                ],
                "type": "column"
              }
            ]
          ],
          "table": "owlet",
          "timeColumn": "\"time\"",
          "timeColumnType": "timestamptz",
          "where": [
            {
              "name": "$__timeFilter",
              "params": [],
              "type": "macro"
            }
          ]
        }
      ],
      "thresholds": [
        {
          "colorMode": "critical",
          "fill": true,
          "line": true,
          "op": "lt",
          "value": 80,
          "yaxis": "left"
        }
      ],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "Baby's O2 Saturation",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "percent",
          "label": "",
          "logBase": 1,
          "max": "100",
          "min": "70",
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    },
    {
      "datasource": null,
      "fieldConfig": {
        "defaults": {
          "custom": {},
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 25
              },
              {
                "color": "#EAB839",
                "value": 50
              },
              {
                "color": "#6ED0E0",
                "value": 60
              }
            ]
          },
          "unit": "percent"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 5,
        "w": 4,
        "x": 0,
        "y": 6
      },
      "id": 8,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "last"
          ],
          "fields": "/^bat$/",
          "values": false
        },
        "textMode": "auto"
      },
      "pluginVersion": "7.3.1",
      "targets": [
        {
          "format": "time_series",
          "group": [],
          "metricColumn": "none",
          "rawQuery": false,
          "rawSql": "SELECT\n  \"time\" AS \"time\",\n  bat\nFROM owlet\nWHERE\n  $__timeFilter(\"time\")\nORDER BY 1",
          "refId": "A",
          "select": [
            [
              {
                "params": [
                  "bat"
                ],
                "type": "column"
              }
            ]
          ],
          "table": "owlet",
          "timeColumn": "\"time\"",
          "timeColumnType": "timestamptz",
          "where": [
            {
              "name": "$__timeFilter",
              "params": [],
              "type": "macro"
            }
          ]
        }
      ],
      "timeFrom": null,
      "timeShift": null,
      "title": "Baby's Sock Charge",
      "type": "stat"
    },
    {
      "aliasColors": {},
      "bars": true,
      "dashLength": 10,
      "dashes": false,
      "datasource": null,
      "fieldConfig": {
        "defaults": {
          "custom": {}
        },
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 5,
        "w": 4,
        "x": 4,
        "y": 6
      },
      "hiddenSeries": false,
      "id": 10,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": false,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "alertThreshold": true
      },
      "percentage": false,
      "pluginVersion": "7.3.1",
      "pointradius": 0.5,
      "points": true,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "format": "time_series",
          "group": [],
          "metricColumn": "none",
          "rawQuery": false,
          "rawSql": "SELECT\n  \"time\" AS \"time\",\n  mv\nFROM owlet\nWHERE\n  $__timeFilter(\"time\")\nORDER BY 1",
          "refId": "A",
          "select": [
            [
              {
                "params": [
                  "mv"
                ],
                "type": "column"
              }
            ]
          ],
          "table": "owlet",
          "timeColumn": "\"time\"",
          "timeColumnType": "timestamptz",
          "where": [
            {
              "name": "$__timeFilter",
              "params": [],
              "type": "macro"
            }
          ]
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "Baby's Movement",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    }
  ],
  "refresh": "5s",
  "schemaVersion": 26,
  "style": "dark",
  "tags": [],
  "templating": {
    "list": []
  },
  "time": {
    "from": "now-6h",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "",
  "title": "Owlet Dashboard"
}
{{< / highlight >}}

<br />

## Wrapping Up

Big thanks to all the folks that paved the way and made this possible!

* https://github.com/mbevand/owlet_monitor
* https://github.com/BastianPoe/owlet_api


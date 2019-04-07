---
title: "CI/CD and autoscaling from scratch"
date: 2019-04-06T22:55:49-06:00
---

Code gets built. Tested, Shipped. Scaled. You've probably inherited, or wrote implementations that kept some of these processes humming along.

In this post we're going to look at doing _all_ of this from scratch. We'll simulate two "teams" using the pipeline to get into prod. Finally we'll grade the autoscaling with some simple stress tests.

Some of the tools I'll use

* Terraform
* Gitlab CI
* Kubernetes Horizontal Pod Autoscaler
* AWS Autoscaler
* Kaniko

## Creating the Cattle

The two teams have been hard at work building their product in Python. One team is responsible for the frontend, the other handles the backend.

{{< highlight bash "hl_lines=4-5">}}
$ ls -ltr
total 40
-rw-r--r--  1 nathanevans  staff  2006 Apr  7 00:04 README.md
-rw-r--r--  1 nathanevans  staff   553 Apr  7 00:04 app_a.py
-rw-r--r--  1 nathanevans  staff   563 Apr  7 00:04 app_b.py
-rw-r--r--  1 nathanevans  staff    31 Apr  7 00:04 requirements.txt
-rw-r--r--  1 nathanevans  staff   230 Apr  7 00:04 schema.sql
{{< / highlight >}}

The first taste is always free -- we'll write the team's `Dockerfile`s this time...

`Dockerfile.a`'s contents
{{< highlight text >}}
FROM python:3.7.3-alpine3.9

COPY app_a.py /
COPY requirements.txt /
RUN pip install -r /requirements.txt

RUN addgroup -S pyuser && adduser -S -g pyuser pyuser
USER pyuser

CMD ["python", "-u", "app_a.py"]
{{< / highlight >}}


`app_b.py` looks very similar to `app_a.py`, 'cept for a sqlite dependency.

`Dockerfile.b`'s contents
{{< highlight text >}}
FROM python:3.7.3-alpine3.9
...
COPY schema.sql /
RUN apk add sqlite --update
RUN sqlite3 database.db < /schema.sql
...
CMD ["python", "-u", "app_b.py"]
{{< / highlight >}}

## Restrictions and the Build Plan

To create cattle, this pipeline _must_ impose a few restrictions (no cats, sheep or other pets).

So far, we've only imposed the requirement of a container for every service. But what about requiring a repo for each container?

Imposing requirements on teams (and how they get stuff done) shouldn't be taken lightly. In the case of the build plan, it would be easy to mandate a **repo** for every **service** that contains a **build plan** that produces only **one container**.

But we can do better -- by also supporting a **repo** with many **services** that contains **one build plan** that produces **many containers**.

{{< highlight yaml >}}
stages:
  - build

.common_build: &common_build
  stage: build
  image:
    name: gcr.io/kaniko-project/executor:debug
    entrypoint: [""]
  before_script:
    - echo "{\"auths\":{\"$CI_REGISTRY\":{\"username\":\"$CI_REGISTRY_USER\",\"password\":\"$CI_REGISTRY_PASSWORD\"}}}" > /kaniko/.docker/config.json

build:a:
  <<: *common_build
  script:
    - /kaniko/executor
        --context $CI_PROJECT_DIR
        --dockerfile $CI_PROJECT_DIR/Dockerfile.a
        --destination $CI_REGISTRY_IMAGE:app-a/$CI_COMMIT_REF_SLUG-$CI_COMMIT_SHORT_SHA

build:b:
  <<: *common_build
  script:
    - /kaniko/executor
        --context $CI_PROJECT_DIR
        --dockerfile $CI_PROJECT_DIR/Dockerfile.b
        --destination $CI_REGISTRY_IMAGE:app-b/$CI_COMMIT_REF_SLUG-$CI_COMMIT_SHORT_SHA
{{< / highlight >}}


This produces two containers for every push to the repo. We could do better by limiting production to only changes from the container source

{{< highlight yaml "hl_lines=9-12" >}}
...
build:a:
  <<: *common_build
  script:
    - /kaniko/executor
        --context $CI_PROJECT_DIR
        --dockerfile $CI_PROJECT_DIR/Dockerfile.a
        --destination $CI_REGISTRY_IMAGE:app-a/$CI_COMMIT_REF_SLUG-$CI_COMMIT_SHORT_SHA
  only:
    changes:
      - Dockerfile.a
      - app_a.py
...
{{< / highlight >}}

After Gitlab CI picks up the changes, we should see some nice green checkmarks

{{< figure src="/images/gitlab-ci-pipeline-build.png" width="200" >}}

And some containers in the registry!

{{< figure src="/images/gitlab-ci-containers.png" width="800" >}}

## Provisioning a cluster with `eksctl`

> Warning:  AWS billing charges ahead (2 m5.larges and the eks control plane). Ensure your `~/.aws/credentials` are correct

Install `eksctl` and spin up a cluster

{{< highlight bash >}}
$ brew tap weaveworks/tap
$ brew install weaveworks/tap/eksctl
...
$ eksctl create cluster
{{< / highlight >}}

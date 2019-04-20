---
title: "CI/CD from scratch with Kubernetes and Gitlab"
date: 2019-04-06T22:55:49-06:00
tags: ["gitlab", "ci", "kubernetes", "aws", "eks"]
---

Code gets built. Tested, Shipped. Scaled. You've probably inherited, or wrote products that kept these processes humming happily along.

But writing _all_ of it from the ground up? What tools would you use? Given a clean canvas, what would you do differently?

Below is my journey creating a CI/CD workflow using primarily Kubernetes and Gitlab.

I'll be simulating two "teams" using my brand new workflow to get their code into prod. Finally we'll grade the autoscaling with some simple stress tests.

## Creating the Cattle

The two teams have been hard at work building their product in Python. One team is responsible for the frontend (`app_a`), the other handles the backend (`app_b`).

{{< highlight bash "hl_lines=4-5">}}
$ ls -ltr
total 40
-rw-r--r--  1 nathanevans  staff  2006 Apr  7 00:04 README.md
-rw-r--r--  1 nathanevans  staff   553 Apr  7 00:04 app_a.py
-rw-r--r--  1 nathanevans  staff   563 Apr  7 00:04 app_b.py
-rw-r--r--  1 nathanevans  staff    31 Apr  7 00:04 requirements.txt
-rw-r--r--  1 nathanevans  staff   230 Apr  7 00:04 schema.sql
{{< / highlight >}}

The first taste is always free -- here's a `Dockerfile` to get them started working with containers

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


`app_b`'s `Dockerfile` looks very similar to `app_a`'s, except for a sqlite dependency.

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

## Creating a CI plan

Lets start building the containers on every commit.

I'm going to leverage the free 10GB container registry that Gitlab provides for each repo.

Most of the Kaniko boilerplate is stolen straight from [the docs](https://docs.gitlab.com/ee/ci/docker/using_kaniko.html), but a quick summary -- build/tag/push containers without needing a Docker socket.

{{< highlight yaml >}}
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

Two containers for every push to the repo.

We could do better by limiting production to only changes affecting the container source

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


Gitlab CI picks up the changes, we should see some nice green checkmarks.

{{< figure src="/images/gitlab-ci-pipeline-build.png" width="200" >}}

Ignore the lack of software testing in our CI -- we now have shiny containers in the registry!

{{< figure src="/images/gitlab-ci-containers.png" width="800" >}}


## Provisioning a cluster with `eksctl`

> Warning:  AWS billing charges ahead (2 m5.larges and the EKS control plane). Ensure your `~/.aws/credentials` are correct

Install `eksctl` and spin up a cluster

{{< highlight bash >}}
$ brew tap weaveworks/tap
$ brew install weaveworks/tap/eksctl
...
$ eksctl create cluster
[ℹ]  using region us-west-2
[ℹ]  setting availability zones to [us-west-2d us-west-2a us-west-2b]
[ℹ]  subnets for us-west-2d - public:192.168.0.0/19 private:192.168.96.0/19
[ℹ]  subnets for us-west-2a - public:192.168.32.0/19 private:192.168.128.0/19
[ℹ]  subnets for us-west-2b - public:192.168.64.0/19 private:192.168.160.0/19
[ℹ]  nodegroup "ng-b9579267" will use "ami-05ecac759c81e0b0c" [AmazonLinux2/1.11]
[ℹ]  creating EKS cluster "wonderful-badger-1554654309" in "us-west-2" region
[ℹ]  will create 2 separate CloudFormation stacks for cluster itself and the initial nodegroup
[ℹ]  if you encounter any issues, check CloudFormation console or try 'eksctl utils describe-stacks --region=us-west-2 --name=wonderful-badger-1554654309'
[ℹ]  building cluster stack "eksctl-wonderful-badger-1554654309-cluster"
[ℹ]  creating nodegroup stack "eksctl-wonderful-badger-1554654309-nodegroup-ng-b9579267"
[ℹ]  --nodes-min=2 was set automatically for nodegroup ng-b9579267
[ℹ]  --nodes-max=2 was set automatically for nodegroup ng-b9579267
[✔]  all EKS cluster resource for "wonderful-badger-1554654309" had been created
[✔]  saved kubeconfig as "/Users/nathanevans/.kube/config"
[ℹ]  adding role "arn:aws:iam::860083610610:role/eksctl-wonderful-badger-155465430-NodeInstanceRole-1FKRY5KUGQNRI" to auth ConfigMap
[ℹ]  nodegroup "ng-b9579267" has 0 node(s)
[ℹ]  waiting for at least 2 node(s) to become ready in "ng-b9579267"
[ℹ]  nodegroup "ng-b9579267" has 2 node(s)
[ℹ]  node "ip-192-168-32-235.us-west-2.compute.internal" is ready
[ℹ]  node "ip-192-168-72-196.us-west-2.compute.internal" is ready
[ℹ]  kubectl command should work with "/Users/nathanevans/.kube/config", try 'kubectl get nodes'
[✔]  EKS cluster "wonderful-badger-1554654309" in "us-west-2" region is ready
{{< / highlight >}}

`kubectl get nodes -o wide` shows us that `wonderful-badger` is ready for action 🦡

{{< highlight bash >}}
$ kubectl get nodes -o wide
NAME                                           STATUS   ROLES    AGE   VERSION   INTERNAL-IP      EXTERNAL-IP      OS-IMAGE         KERNEL-VERSION                CONTAINER-RUNTIME
ip-192-168-32-235.us-west-2.compute.internal   Ready    <none>   3m    v1.11.9   192.168.32.235   34.219.169.14    Amazon Linux 2   4.14.106-97.85.amzn2.x86_64   docker://18.6.1
ip-192-168-72-196.us-west-2.compute.internal   Ready    <none>   3m    v1.11.9   192.168.72.196   18.236.120.225   Amazon Linux 2   4.14.106-97.85.amzn2.x86_64   docker://18.6.1
{{< / highlight >}}

## Creating some Deployments

How do we get our containers deployed to the cluster?

First, lets get some Deployment objects created that wrap our containers.

{{< highlight yaml "hl_lines=19" >}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app_a
  labels:
    app: app_a
spec:
  replicas: 1
  selector:
    matchLabels:
      app: app_a
  template:
    metadata:
      labels:
        app: app_a
    spec:
      containers:
      - name: app_a
        image: registry.gitlab.com/de1ux/cicd-autoscaling-from-scratch/app-a:wip-388bb9b0
        ports:
        - containerPort: 5000
{{< / highlight >}}

The kubelet isn't going to find our images on Docker Hub, so we'll need to give it credentials to log in to the Gitlab registry.

Add a Secret with an auth token that allows images to be pulled from the Gitlab registry

{{< highlight yaml >}}
apiVersion: v1
data:
  .dockerconfigjson: ew...=
kind: Secret
metadata:
  name: docker-login
  namespace: default
type: kubernetes.io/dockerconfigjson
{{< / highlight >}}

Reference the secret back in the Deployment object
{{< highlight yaml "hl_lines=8-9">}}
...
    spec:
      containers:
      - name: app_a
        image: registry.gitlab.com/de1ux/cicd-autoscaling-from-scratch/app-a:wip-388bb9b0
        ports:
        - containerPort: 5000
      imagePullSecrets:
        - name: docker-login
...
{{< / highlight >}}

Now we can deploy the object manually with `kubectl apply -f`.

`kubectl get` shows the deploy is up and running!

{{< highlight yaml >}}
$ kubectl get all -l app=app-a -o wide
NAME                         READY   STATUS    RESTARTS   AGE   IP               NODE                                           NOMINATED NODE
pod/app-a-6d58b6d665-gw6tp   1/1     Running   0          5m    192.168.74.110   ip-192-168-72-196.us-west-2.compute.internal   <none>

NAME                    DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS   IMAGES                                                                       SELECTOR
deployment.apps/app-a   1         1         1            1           5m    app-a        registry.gitlab.com/de1ux/cicd-autoscaling-from-scratch/app-a:wip-388bb9b0   app=app-a

NAME                               DESIRED   CURRENT   READY   AGE   CONTAINERS   IMAGES                                                                       SELECTOR
replicaset.apps/app-a-6d58b6d665   1         1         1       5m    app-a        registry.gitlab.com/de1ux/cicd-autoscaling-from-scratch/app-a:wip-388bb9b0   app=app-a,pod-template-hash=2814628221
{{< / highlight >}}

Repeating this process for `app_b`, `kubectl get` now shows
{{< highlight yaml >}}
$ kubectl get all -o wide
NAME                         READY   STATUS    RESTARTS   AGE   IP               NODE                                           NOMINATED NODE
pod/app-a-6d58b6d665-gw6tp   1/1     Running   0          9m    192.168.74.110   ip-192-168-72-196.us-west-2.compute.internal   <none>
pod/app-b-647684498b-qd7mc   1/1     Running   0          54s   192.168.78.0     ip-192-168-72-196.us-west-2.compute.internal   <none>

NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE   SELECTOR
service/kubernetes   ClusterIP   10.100.0.1   <none>        443/TCP   39m   <none>

NAME                    DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS   IMAGES                                                                       SELECTOR
deployment.apps/app-a   1         1         1            1           9m    app-a        registry.gitlab.com/de1ux/cicd-autoscaling-from-scratch/app-a:wip-388bb9b0   app=app-a
deployment.apps/app-b   1         1         1            1           54s   app-b        registry.gitlab.com/de1ux/cicd-autoscaling-from-scratch/app-b:wip-388bb9b0   app=app-b

NAME                               DESIRED   CURRENT   READY   AGE   CONTAINERS   IMAGES                                                                       SELECTOR
replicaset.apps/app-a-6d58b6d665   1         1         1       9m    app-a        registry.gitlab.com/de1ux/cicd-autoscaling-from-scratch/app-a:wip-388bb9b0   app=app-a,pod-template-hash=2814628221
replicaset.apps/app-b-647684498b   1         1         1       54s   app-b        registry.gitlab.com/de1ux/cicd-autoscaling-from-scratch/app-b:wip-388bb9b0   app=app-b,pod-template-hash=2032400546
{{< / highlight >}}

## Continuously deploying... some Deployments

To trigger a deploy, the Deployment object's `image` must change and be submitted back to the Kubernetes API server.

A quick way to do this is with `sed` to change the `image` value, then `kubectl replace`.

But `kubectl`will need credentials, so let's supply them as environment variables in the CI pipeline.

To set the value of $KUBE_CONFIG in CI, run `cat ~/.kube/config | base64 | pbcobpy` and paste the value to Gitlab CI's [evironment variables](https://gitlab.com/help/ci/variables/README#variables).

Same thing for $AWS_CREDENTIALS -- `cat ~/.aws/credentials | base64 | pbcobpy` and paste the value to Gitlab CI's environment variables.

{{< highlight yaml "hl_lines=16" >}}
...
build:a:
  stage: build
...

.common_deploy: &common_deploy
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --update curl
    - curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
    - chmod +x ./kubectl
    - mv ./kubectl /usr/local/bin/kubectl
    - curl -o aws-iam-authenticator https://amazon-eks.s3-us-west-2.amazonaws.com/1.12.7/2019-03-27/bin/linux/amd64/aws-iam-authenticator
    - chmod +x ./aws-iam-authenticator
    - mv ./aws-iam-authenticator /usr/local/bin/heptio-authenticator-aws

    - mkdir -p ~/.kube
    - echo $KUBE_CONFIG | base64 -d > ~/.kube/config

    - mkdir -p ~/.aws
    - echo $AWS_CREDENTIALS | base64 -d > ~/.aws/credentials

deploy:a:
  <<: *common_deploy
  script:
    - export IMAGE=$CI_REGISTRY_IMAGE/app-a:$CI_COMMIT_REF_SLUG-$CI_COMMIT_SHORT_SHA
    - 'sed -i app-a-deploy.yaml -e "s|\image: .*|image: $IMAGE|g"'
    - echo "Replacing app-a object..."

    - echo "--- START DEFINITION ---"
    - cat app-a-deploy.yaml
    - echo "--- END DEFINITION ---"

    - kubectl replace -f app-a-deploy.yaml
    - echo "Replacing app-a object...done"

{{< / highlight >}}

> Note the highlight on naming the `aws-iam-authenticator` as `heptio-authenticator-aws`: the `kube/.config` that `eksctl` autogenerates references an out-of-date binary when converting the IAM credentials into an access token

Running gives the following pipeline view in Gitlab

{{< figure src="/images/gitlab-ci-pipeline-build-and-deploy.png" width="400" >}}

And a kubectl get confirms the pods were updated!
{{< highlight bash >}}
$ kubectl get all -o wide
NAME                         READY   STATUS    RESTARTS   AGE   IP               NODE                                           NOMINATED NODE
pod/app-a-746c68b8d5-qqs85   1/1     Running   0          1m    192.168.64.164   ip-192-168-72-196.us-west-2.compute.internal   <none>
pod/app-b-75d99fc89b-2hgvm   1/1     Running   0          1m    192.168.46.153   ip-192-168-32-235.us-west-2.compute.internal   <none>

NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE   SELECTOR
service/kubernetes   ClusterIP   10.100.0.1   <none>        443/TCP   2h    <none>

NAME                    DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS   IMAGES                                                                       SELECTOR
deployment.apps/app-a   1         1         1            1           1h    app-a        registry.gitlab.com/de1ux/cicd-autoscaling-from-scratch/app-a:wip-024d109d   app=app-a
deployment.apps/app-b   1         1         1            1           1h    app-b        registry.gitlab.com/de1ux/cicd-autoscaling-from-scratch/app-a:wip-024d109d   app=app-b

NAME                               DESIRED   CURRENT   READY   AGE   CONTAINERS   IMAGES                                                                       SELECTOR
replicaset.apps/app-a-6d58b6d665   0         0         0       1h    app-a        registry.gitlab.com/de1ux/cicd-autoscaling-from-scratch/app-a:wip-388bb9b0   app=app-a,pod-template-hash=2814628221
replicaset.apps/app-a-746c68b8d5   1         1         1       1m    app-a        registry.gitlab.com/de1ux/cicd-autoscaling-from-scratch/app-a:wip-024d109d   app=app-a,pod-template-hash=3027246481
replicaset.apps/app-b-647684498b   0         0         0       1h    app-b        registry.gitlab.com/de1ux/cicd-autoscaling-from-scratch/app-b:wip-388bb9b0   app=app-b,pod-template-hash=2032400546
replicaset.apps/app-b-75d99fc89b   1         1         1       1m    app-b        registry.gitlab.com/de1ux/cicd-autoscaling-from-scratch/app-a:wip-024d109d   app=app-b,pod-template-hash=3185597456
{{< / highlight >}}

> Disclaimer:

> I'm not proud of this deployment mechanism. Check out some of my other posts about manipulating properties of Kubernetes objects using client-go.

> Because it's just a `kubectl replace`, there's no blocking or exit code if the container fails pull, become ready, etc.

> And pasting root Kubernetes creds into an environment variable is bad form: the CI plan's access should be scoped to an RBAC role with only the appropriate verbs for Deployments.

## Service discovery

In this example, `app_a` is the frontend and `app_b` is the backend.

`app_a` gets a NodePort because if you try to use a LoadBalancer, the ALB controller will error.

{{< highlight yaml >}}
apiVersion: v1
kind: Service
metadata:
  name: app-a
spec:
  type: NodePort
  selector:
    app: app-a
  ports:
    - protocol: TCP
      port: 5000
      targetPort: 5000
{{< / highlight >}}

`app_b` gets an ordinary LoadBalancer

{{< highlight yaml >}}
apiVersion: v1
kind: Service
metadata:
  name: app-b
spec:
  selector:
    app: app-b
  type: LoadBalancer
  ports:
   -  protocol: TCP
      port: 5001
      targetPort: 5001
{{< / highlight >}}

At this point, we can inform the developers of `app_a` that service discovery of `app_b` is available at `http://app-b.default.svc.cluster.local`.

## Load balancers

I have an SSL cert for `he1ena.com` laying around in AWS ACM, so that's what I'll use to expose `app_a` to the world on 443. `app_b` will stay internal only.

To communicate with the NodePort for `app_a`, we need an

1. ALB Ingress object
2. ALB Ingress Controller object
3. RBAC for the Controller

For more info, see this excellent tutorial on getting [AWS setup correctly](https://github.com/pahud/eks-alb-ingress)

After the controller provisions an ALB (be patient), you can add TLS settings like I did

{{< figure src="/images/alb-wizard.png" width="800" >}}

To test everything is setup correctly, I can curl `app_a` and get a response

{{< highlight bash >}}
$ curl -k -X POST -H 'Authorization: mytoken' https://297d8710-default-webappalb-9895-1623198960.us-west-2.elb.amazonaws.com/jobs
Jobs:
Title: Devops
Description: Awesome
{{< / highlight >}}

## Autoscaling

> Warning: bad science ahead

Before we talk about autoscaling, lets see how many requests our one replica can handle

{{< highlight go >}}
package main

import (
  "crypto/tls"
  "fmt"
  "net/http"
  "sync"
  "time"
)

func main() {
  wg := &sync.WaitGroup{}

  tr := &http.Transport{
    TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
  }
  start := time.Now()

  for i := 0; i < 10000; i++ {
    wg.Add(1)
    go func(i int) {
      client := &http.Client{Transport: tr, Timeout: time.Second * 15}
      req, err := http.NewRequest("POST", "https://297d8710-default-webappalb-9895-1623198960.us-west-2.elb.amazonaws.com/jobs", nil)
      if err != nil {
        fmt.Println(err)
        wg.Done()
        return
      }

      req.Header.Set("Authorization", "mytoken")

      _, err = client.Do(req)
      if err != nil {
        fmt.Println(err)
      }
      fmt.Printf("Done: %d\n", i)
      wg.Done()
    }(i)

    // Give my poor networking card a chance to breathe
    if i%1000 == 0 {
      wg.Wait()
    }
  }
  wg.Wait()
  fmt.Printf("Time elapsed in seconds: %f", time.Now().Sub(start).Seconds())
}
{{< / highlight >}}


And running it
{{< highlight bash >}}
$ go run main.go
...
Time elapsed in seconds: 87.183679
{{< / highlight >}}

~87 seconds for an interpreted program to serve 10K requests isn't bad! But what if we served 4 replicas for each service?

{{< highlight bash >}}
$ kubectl scale --replicas=4 deployment/app-a
deployment.extensions/app-a scaled
$ kubectl scale --replicas=4 deployment/app-b
deployment.extensions/app-b scaled
{{< / highlight >}}

Rerunning the stressor
{{< highlight bash >}}
$ go run main.go
...
Time elapsed in seconds: 54.551356
{{< / highlight >}}

~33 seconds faster! More importantly, scaling out took two presses of my keyboard.

## Wrapping up

Of all the shortcuts that this post took (and there were a few!), what would be the next steps?

### Scope Gitlab CI runners access to least privilege model

The CI runners had the same RBAC policy that `eksctl` generated for me. Bad, bad mojo if you decide to trust that level of access to Gitlab.com's shared CI runners.

### Get what `eksctl` generated into an IaC tool ASAP

Terraform has an `import` command that would remedy all the AWS console shortcuts this post took. And `eksctl create` is really an alias for applying a specialized CloudFormation stack, if that's more your style.

### Write a draft of the requirements this workflow imposes

At a minimum, the bar of entry would be

1. Containers
2. Healthchecks
3. Requests/limits on containers

Ommitting 1 is impossible, but 2 and 3 are operational nightmares to backfill later. Better the teams define them early with too much cushion, than trying to divine them later.

### Write or encourage teams to provide a meaningful post-deploy test

It doesn't have to be complicated, but checking that the new deployment object was received by the Kubernetes API server is not enough.

### Consider a thin DSL object for abstracting Kubernetes out of product repos

This is another one that's hard to walk back -- putting raw Kubernetes object YAMLs inside the repos they service.

While it's awesome to have developers that want to learn about Kubernetes, making wide sweeping changes to the objects (e.g. upgrading Kubernetes) across many repos is painful.

A DSL can mitigate all of this. Check in a file that contains the values developers care about (image, ports, requests/limits, environment vars, etc) and boilerplate the rest in an automated process that Ops controls.

And even if a DSL isn't appropriate, having a conversation with developers about what deployment functionality they need to get their job done is always helpful.



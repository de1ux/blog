---
title: "Kubernetes client-go: Updating and rolling back a deployment"
date: 2018-11-23T1:34:00-06:00
---

### WARNING
All of this was written during version 6.0 of the Kubernetes client. The information here may be out of date: ymmv

### Picking the right Kubernetes client version

Kubernetes provides an excellent [compatibility matrix](https://github.com/kubernetes/client-go/tree/v6.0.0#compatibility-matrix) to help target the right client version for communicating with the cluster.

***Don't*** worry about picking a minor version higher than your current Kubernetes API minor version; I targeted two versions ahead of the API server and all tested out well.

***Do*** worry if you plan on exercising non-core/alpha client features that your cluster might not support.

### Installing k8s.io/client-go

Currently, the client does not play well with [dep](https://github.com/golang/dep), but the authors have done a great writeup about the [install options currently available](https://github.com/kubernetes/client-go/blob/master/INSTALL.md).

Here's a quick and dirty build script ganked from their INSTALL.md:
{{< highlight bash >}}
$ go get -v github.com/tools/godep
$ go get -v k8s.io/client-go/...
$ pushd $GOPATH/src/k8s.io/client-go
$ git checkout v6.0.0
$ godep restore ./...
$ popd
{{< / highlight >}}

### Create a Kubernetes clientset

It's likely you have a `$HOME/.kube/config` already from playing with `kubectl` and minikube, making it trivial to generate a client (or as Kubernetes calls it, a `clientset`).
{{< highlight go >}}
config, err := clientcmd.BuildConfigFromFlags("", filepath.Join(homedir.HomeDir(), ".kube", "config"))
if err != nil {
    panic(err)
}

clientSet, err := kubernetes.NewForConfig(config)
if err != nil {
    panic(err)
}
{{< / highlight >}}

### Getting an existing deployment

Before we start a new deployment, we first need to assert that an existing deployment is running and in a good state.

Here is a YAML of redis I've been toying around with in `kubectl` that will provide the initial containers.


{{< highlight yaml >}}
apiVersion: apps/v1beta2 # for versions before 1.8.0 use apps/v1beta1
kind: Deployment
metadata:
  name: redis
spec:
  selector:
    matchLabels:
      app: redis
  replicas: 2 # tells deployment to run 2 pods matching the template
  template: # create pods using pod definition in this template
    metadata:
      # unlike pod-nginx.yaml, the name is not included in the meta data as a unique name is
      # generated from the deployment name
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:3
        ports:
        - containerPort: 6379
{{< / highlight >}}

{{< highlight bash >}}
$ kubectl create -f deployments/redis.yaml
{{< / highlight >}}

Now we'll use Go to verify the redis deployment exists and all replicas are in a `running` state.

{{< highlight go >}}
dClient := clientSet.ExtensionsV1beta1().Deployments("default")

// Get a copy of the current deployment
originalDeployment, err := dClient.Get("redis", metav1.GetOptions{})
if err != nil {
    panic(err)
}

// Verify the current containers in the pod are running
if allRunning, err := podContainersRunning(clientSet, "redis"); !(allRunning && err == nil) {
    panic(fmt.Sprintf("Not all containers are currently running, or err: %s", err))
}
{{< / highlight >}}

Since we've asserted the existing redis deploy is running and available, we now know that

* any issues during our deploy are likely caused by us, and not the existing containers
* there is a succesful deploy to rollback to

### Updating a deployment

Updating a deployment is as easy as updating the fields we're interested in and resubmitting it to the cluster. The redis tag is intentionally incorrect to simulate an unhealthy deploy.

{{< highlight go >}}
dClient := client.ExtensionsV1beta1().Deployments("default")

retryErr := retry.RetryOnConflict(retry.DefaultRetry, func() error {
    // Assumes you've already deployed redis before to the cluster
    result, getErr := dClient.Get("redis", metav1.GetOptions{})
    if getErr != nil {
        panic(fmt.Errorf("Failed to get latest version of redis: %s", getErr))
    }

    result.Spec.Template.Spec.Containers[0].Image = "redis:doesntexist"
    _, updateErr := dClient.Update(result)
    return updateErr
})

if retryErr != nil {
    panic(retryErr)
}
{{< / highlight >}}

Every deployment object returned from client-go includes a resource version indicating the version that cluster has seen. If the redis deployment is updated during *our* attempt to update the same redis deployment, the server will reject us because our resource versions conflict.

Thankfully, client-go provides a `RetryOnConflict` utility that debounces conflict errors. On each retry of the deployment, we get a fresh copy of the cluster's current redis deployment and apply our deployment operation over top of it.

From the examples for `RetryOnConflict`
{{< highlight text >}}
//    You have two options to Update() this Deployment:
//
//    1. Modify the "deployment" variable and call: Update(deployment).
//       This works like the "kubectl replace" command and it overwrites/loses changes
//       made by other clients between you Create() and Update() the object.
//    2. Modify the "result" returned by Get() and retry Update(result) until
//       you no longer get a conflict error. This way, you can preserve changes made
//       by other clients between Create() and Update(). This is implemented below
//           using the retry utility package included with client-go. (RECOMMENDED)
//
// More Info:
// https://github.com/kubernetes/community/blob/master/contributors/devel/api-conventions.md#concurrency-control-and-consistency
{{< / highlight >}}

Thinking of deploys as operations on top of deployment objects naturally leads to abstracting the *contents* of the operation away from the *act* of deploying.

{{< highlight go >}}
if err := deploy(dClient, "redis", func(deployment *apiv1.Deployment) {
    deployment.Spec.Template.Spec.Containers[0].Image = "redis:doesntexist"
}); err != nil {
    panic(err)
}

err = waitForPodContainersRunning(clientSet, "redis")
if err == nil {
    println("Deploy successful")
}
{{< / highlight >}}

{{< highlight go >}}
func deploy(dClient v1.DeploymentInterface, app string, op func(deployment *apiv1.Deployment)) error {
    return retry.RetryOnConflict(retry.DefaultRetry, func() error {
        result, err := dClient.Get(app, metav1.GetOptions{})
        if err != nil {
            panic(fmt.Errorf("Failed to get latest version of %s: %s", app, err))
        }

        op(result)

        _, updateErr := dClient.Update(result)
        return updateErr
    })
}
{{< / highlight >}}

### Rolling back a deployment

If a deployment fails, rolling back the operation requires reversing the fields modified during the deployment operation and resubmitting the deploy.

{{< highlight go >}}
// Try rolling back
if err := deploy(dClient, "redis", func(deployment *apiv1.Deployment) {
    deployment.Spec.Template.Spec.Containers[0].Image = originalDeployment.Spec.Template.Spec.Containers[0].Image
}); err != nil {
    panic(err)
}

err = waitForPodContainersRunning(clientSet, "redis")
if err != nil {
    panic(err)
}
println("Rolled back successfully!")
{{< / highlight >}}

### Notes

* [Exercise code](https://github.com/de1ux/kubernetes_exercises/blob/master/exercises/deploy.go)
* [Client-go examples](https://github.com/kubernetes/client-go/tree/v6.0.0/examples)

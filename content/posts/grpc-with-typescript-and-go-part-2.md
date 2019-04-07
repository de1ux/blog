---
title: "Grpc With Typescript and Go Part 2"
date: 2018-12-22T23:01:00-06:00
---

In [part 1](/tutorials/grpc-with-typescript-and-go-part-1) we:

* defined a gRPC service (`LogService`)
* generated the server and client with `protoc`
* stubbed the gRPC server implementation in Go

### Getting logs from Kubernetes

Right now, our `GetLogs` method is not very interesting.

{{< highlight go >}}
func (service) GetLogs(_ context.Context, request *api.GetLogsRequest) (*api.GetLogsResponse, error) {
    panic("implement me")
}
{{< / highlight >}}

Let's import the lovely [Kubernetes client-go](https://github.com/kubernetes/client-go) and get to work returning real logs.

Get a client to communicate with the Kubernetes cluster
{{< highlight go >}}
func getClientSet() (*kubernetes.Clientset, error) {
    config, err := clientcmd.BuildConfigFromFlags("", filepath.Join(homedir.HomeDir(), ".kube", "config"))
    if err != nil {
        return nil, err
    }

    return kubernetes.NewForConfig(config)
}
{{< / highlight >}}

And return some logs given a `podName`.
{{< highlight go >}}
func getJobPodLogStream(client *kubernetes.Clientset, podName string) rest.Result {
    return client.
        RESTClient().
        Get().
        Prefix("api/v1").
        Namespace("default").
        Name(podName).
        Resource("pods").
        SubResource("log").
        Param("timestamps", "true").
        Do()
}
{{< / highlight >}}

If you prefer, `client-go` also exposes a `GetLogs` [method](https://github.com/kubernetes/client-go/blob/03bfb9bdcfe5482795b999f39ca3ed9ad42ce5bb/kubernetes/typed/core/v1/pod_expansion.go#L44) that abstracts calling the `RESTClient` directly.

Now consume our new functions in `GetLogs`
{{< highlight go >}}
func (service) GetLogs(_ context.Context, request *api.GetLogsRequest) (*api.GetLogsResponse, error) {
    client, err := getClientSet()
    if err != nil {
        return nil, status.Errorf(codes.Internal, "Failed to create clientset: %s", err)
    }

    result := getJobPodLogStream(client, request.PodName)
    if result.Error() != nil {
        return nil, status.Errorf(codes.Internal, "Failed to get logs: %s", result.Error())
    }

    b, err := result.Raw()
    if err != nil {
        return nil, status.Errorf(codes.Internal, "Failed to coerce logs to bytes: %s", err)
    }

    lines := strings.Split(string(b), "\n")
    return &api.GetLogsResponse{Data: lines}, nil
}
{{< / highlight >}}

Each RPC to `GetLogs` will

* create a k8s clientset
* fetch the latest pod logs given a pod name as bytes
* decode the byte slice to a string
* split the string by newline into many strings
* return a `Logs` object containing the strings

### Testing

You'll (obviously) need a pod to attempt to fetch logs from - here's the one I used
{{< highlight yaml >}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: random-logger
  labels:
    app: random-logger
spec:
  replicas: 1
  selector:
    matchLabels:
      app: random-logger
  template:
    metadata:
      labels:
        app: random-logger
    spec:
      containers:
      - name: random-logger
        image: chentex/random-logger
{{< / highlight >}}


We can temporarily invoke the `GetLogs` method manually by  modifying `main.go`.
It's crude, but sanity checks our Kubernetes logic without needing a client to call `GetLogs`.

{{< highlight go >}}
func main() {
    grpcServer := grpc.NewServer()

    s := &service{}
    logs, err := s.GetLogs(context.Background(), &api.GetLogsRequest{PodName: "random-logger-7f68f7949-88zrw"})
    if err != nil {
        panic(err)
    }
    println(strings.Join(logs.Data, "\n"))
}
{{< / highlight >}}

Which outputs

{{< highlight text >}}
2018-12-21T02:17:49.719640287Z 2018-12-21T02:17:49+0000 WARN variable not in use.
2018-12-21T02:17:59.725955725Z 2018-12-21T02:17:59+0000 WARN variable not in use.
2018-12-21T02:18:04.729879584Z 2018-12-21T02:18:04+0000 ERROR something happened in this execution.
2018-12-21T02:18:09.733047306Z 2018-12-21T02:18:09+0000 INFO takes the value and converts it to string.
2018-12-21T02:18:13.737322556Z 2018-12-21T02:18:13+0000 INFO takes the value and converts it to string.
2018-12-21T02:18:23.746870251Z 2018-12-21T02:18:23+0000 WARN variable not in use.
...
{{< / highlight >}}

[Next we'll build a Typescript client to tie all the pieces together and produce a working app](/tutorials/grpc-with-typescript-and-go-part-3)

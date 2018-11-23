---
title: "Building a webapp for pod logs: gRPC with Typescript and Go"
author: nathan
date: 2018-11-22 19:08
template: article.pug
---

<span class="more"></span>

One of the best tools for diagnosing failed Kubernetes deployments is with the log viewer, `kubectl logs`.

But direct `kubectl logs` may be restricted to Ops if your organization doesn't allow engineers access to the Kubernetes cluster.

Or our end users may not be technical, or have `kubectl` installed.

So lets build a webapp that provides the same functionality as `kubectl logs`.

Requests to the webapp will be routed from the browser to a Go service over gRPC. Then Go will make API requests to the kube api-server.

```[ Browser ] -> [ Go service ]-> [ Kube api-server ]```

Business rules, auth, etc can later be bolted on to Go service.

### Messaging

Let's write the gRPC messages that the browser will use to request logs from the Go service.

```proto
syntax="proto3";

message Empty {}

message Logs {
  repeated string data = 1;
}

service LogService {
  rpc GetLogs(Empty) returns (Logs);
}
```

If you don't already have `protoc` available in your $PATH, install it from the [releases page](https://github.com/protocolbuffers/protobuf/releases).

Install the protobuf plugin for Go
```bash
$ go get -u github.com/golang/protobuf/protoc-gen-go
```

Install the protobuf plugin for Typescript
```bash
$ npm i --save-dev ts-protoc-gen
```

Now we can run `protoc` on our protobuf

```bash
# Make a folder for the output
$ mkdir generated
$ protoc \
    --plugin="protoc-gen-ts=node_modules/ts-protoc-gen/bin/protoc-gen-ts" \
    --ts_out="service=true:generated" \
    --go_out="plugins=grpc:generated" \
    service.proto
```

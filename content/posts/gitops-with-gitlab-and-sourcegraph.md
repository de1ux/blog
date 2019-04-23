---
title: "GitOps: automating code changes across many repos"
date: 2019-04-21T10:21:44-06:00
---

### What is GitOps

GitOps is the practice of using git repos to _automate something_.

I'm sure there are many opinions as the term is fairly new.

Some examples:

> Contributing Terraform code to a repo that is setup to `terraform apply` changes detected in master to the infrastructure.


> Or a repo with a YAML file that defines Gitlab permissions. When a user wants access to something, they make a  merge request. When the merge request is approved by the other members, it's merged to master. When the change hits master, automation kicks off to make the Gitlab permissions reflect the YAML file in source.

### Why

Git provides a rich audit trail of who did what, when and why.

It's also transparent. CI statuses spell out how long an operation will take once the merge request hits master. And if you want to know _exactly_ what happens when a merge request hits master, examining the build plan shows the nuts and bolts.

Devs work in git everyday and typically dislike JIRA, etc. If getting new infrastructure, rollbacks and permission adjustements is as easy as making a merge request -- you're likely to win friends.

### The Problem

If you're company uses monolithic repos, congrats - none of this applies to you.

But if you're at a company that uses microservice architectures, you need to be able to make code changes across all microservice repos.

An example is an internal Java library that handles the big dollars/currencies, special dates, etc.

When a bug is found in one of these libraries, you must fix it and shepherd a multitude of MRs as the release lands to all the consumers.

For a while, I've seen companies push these releases by hand. Other  tools like [Dependabot](https://dependabot.com/) or [Shepherd](https://www.nerdwallet.com/blog/engineering/shepherd-automating-code-changes/) were purpose built for this problem.

**If you're using Github**, I strongly recommend one of the above tools.

**If you're using self-hosted Gitlab**, I'm not sure -- there's probably someone thats solved this problem.

**If you're using cloud-hosted Gitlab.com** -- it gets interesting. Gitlab.com offers no group/global code search (at least, [not until November](https://docs.gitlab.com/ee/user/search/advanced_global_search.html)[^1])

I'm in the Gitlab.com camp. We'll need to get creative to deliver a GitOps solution for automating code changes.

### The Solution

Sourcegraph is a free[^2], open source code searching tool.[^3]

And we're going to bootstrap a Sourcgraph instance to get global code search off our repos on Gitlab.com;

With global code search, we can write a git repo that lets users commit glorified find/replace stanzas.

The repo's CI plan will detect the stanzas, query sourcegraph for matches, and then issue MRs with the replacements in the diff.

### Standing up the Sourcegraph instance

If you want to do this in Kubernetes, you'll need a l$cense key, so I'm going to stick to the docker container.

If you're worried about how manhy miles you can get on just a docker container, the reps have this to say:

```
insert rep text here
```

Standup the sourcegraph instance

```bash
$ docker run --publish 7080:7080 --publish 2633:2633 --rm --volume ~/.sourcegraph/config:/etc/sourcegraph --volume ~/.sourcegraph/data:/var/opt/sourcegraph sourcegraph/server:3.2.2
```

Log in

Do things to get it going






[^1]: Gitlab.com veterans will know that this MVP is likely to be unperformant
[^2]: up to 100 users
[^3]: and they stand to make bank off all the companies that switched to Gitlab.com without evaluating the code search (or lack thereof)


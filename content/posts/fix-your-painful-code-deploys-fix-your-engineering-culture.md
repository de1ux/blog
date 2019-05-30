---
title: "Fix your painful code deploys, fix your Engineering culture"
date: 2019-05-29T16:59:53-06:00
---

You can paste your Engineering values in the wiki. Print it on every mug, proclaim it at every job fair. Reiterate them in meetings until you're blue in the face.

But how do you measure if you're living up to those values?

No surprise: look at the way developers write, test and collaborate on code. It speaks volumes about the culture of your Engineering org.

But if you want the the Cliff Notes — the abstract before you read the whole paper, look at how code gets shipped.

> “...where code deployments are most painful, you’ll find the poorest software delivery performance, organizational performance, and culture."

> Forsgren, N., Humble, J., & Kim, G. (2018). Accelerate: The science behind DevOps: Building and scaling high performing technology organizations. Portland, OR: IT Revolution.

If shipping code and Engineering culture are linked, then what pain can shipping code inflict on the org?

Well, pain is a pretty well-known concept, but it’s surprising how much we can endure before becoming numb to it. Our org can build a deep, convincing narrative that ignores  pain until it manifests as burnout.

## Introspection

I challenge you! Before you read further: introspect your reaction to this list.

Some will evoke “well, no duh” reactions, but if your brain provides narratives to justify one, jot it down.

Justify the rationale to yourself to see if it holds merit, or perhaps masks painful truth.

## Characteristics of painful deploys

### Multiple teams required to deploy code to a production-like environment

Mandatory coordination with other teams for new deploys is painful. I'm not talking about getting stakeholder buy-in. I'm not talking about "stealthing" an application to skirt political conflict (yes! I've seen that).

I mean your team doesn't have the tools to self-service a new deployment (or protoype) into a production-like environment.

Organizations that invest in autonomous team prototyping with meaningful, production-like data teem with innovation. You’ve seen these organizations with their hackdays, 20% time projects that turned into company products.

They come to the table with data, eliminate conjecture and crush deadlock. They breathe innovation and accountability.

###  production-like ain’t like production at all

Emulating production is hard, and justifications for the skew are easy: hardware cost, engineering investment, technical synchronization issues, historical reasons. The blame game and finger pointing is common too:

* "It’s the business’s fault because they didn’t budget enough for a "production-like" environment."
* "It’s DevOps fault because the production-like instances are too slow."
* "It’s the DBAs fault because the apps don't have meaningful data to use."
* "It’s the developers fault because they don’t know how to test outside of production”

Solution?

Incentivize good behavior. If everyone has access to test in production, why would I want to test anywhere else?

Mentor, and socialize good testing strategies. It's usually not enough to have one high-performing team using the production-like environment. Others might just not know why testing outside of production is beneficial, or hold myths (e.g. "it will slow us down").

### The configuration isn’t source controlled

Consul has a time and place, but if app configuration isn't in source, your code deployments _will_ be painful.

You'll need manual coordination with the Consul gatekeepers, the change owners, etc. It will suck.

### Teams can't deploy, redeploy, rollback their app

High performing teams constantly tune their release velocity. They respond to emergencies with judicious use of rollbacks and rollforwards. They understand when a redeploy is technically prudent, not as a bandaid or overused playbook.

What incentive does a team have to become a high performer if they can’t control these operations?

And are team privileges defined by the lowest common denominator? Or is it a framework for converting low-performers into high-performers?

### Teams can’t contribute IaC to support deploys

When IaC development is restricted to specific teams (DevOps, etc), for political, technical, or cultural reasons.

Now I’m not saying that Software Developers should be primary contributors of IaC. I mean, teams _can’t_ contribute.

But you’d be surprised at the willingness of developer to write a little Terraform when a code deploy is blocked by it.

## So what?

If my code deploys are painful, does that mean my Engineering culture is doomed?

Absolutely not! It means you have job security to make it better! And these are very technical, deeply rewarding pain points to solve _because they impact everyone_.

So if you need a quote for your boss to convince him to invest in pleasant code deploys, here's *Accelerate* again:

> “Deployment pain can lead to burnout if left unchecked.”

> Forsgren, N., Humble, J., & Kim, G. (2018). Accelerate: The science behind DevOps: Building and scaling high performing technology organizations. Portland, OR: IT Revolution.

Or one from me

> "Fix your painful code deploys, fix your Engineering culture"

> Evans, N., (2019). Text on a webpage

---
title: "What I Learned From a Year of Devops"
date: 2018-11-25T16:51:00-06:00
---

Last year I had the opportunity to join DevOps, and with it, a whole new class
of challenges that Ops faces.

And I'm glad I did.

But if I could have given myself some knowledge to prepare for DevOps a year ago, this would be it.

### You will (still) grow as a Developer in DevOps

During the interview, my first question was ***can I still code***. And
the short answer to that is ***yes***.

The longer answer is ***maybe not as much at first***, but that's a good thing. Learning how
to write code that plays nicely with mission-critical infrastructure adds another layer of
complexity.

Some of the symptoms of growing as a Developer in DevOps:
* Having an exit strategy for when things ***will*** go wrong
    * If the database restore logic fails halfway through, what will the code do?
    * How should this be structured to easily know the outcome, good or bad?
    * How do I meaningfully control errors instead of adopting a diaper pattern?
* Thinking clever code is as stressful as sloppy code
    * Would I be able to debug this code if it woke me up in the middle of the night?
    * If production is on fire, would I enjoy trying to understand
    a function that does too many things?
* Knowing about issues before they're a problem
    * Would I like to get error reports from customers/CSM's/etc. when data is missing,
    or a PagerDuty alert when an automated job fails?
    * How do I structure my code to alert in a meaningful way vs. becoming a nuisance?

### Measure the right things

As a software developer, success means shipping reliable products, responding quickly to
changes, fixing bugs, getting features out.

But in DevOps, success isn't always correlated with code.

Patching, upgrading, hardening, responding to alerts,
developer requests, auditor requests, Release Management, InfoSec - these take up some of
your coding time.

The following snippet is about tech leads, but it felt accurate in my early experience with
DevOps.
> After a few months into my first tech lead role, I was becoming increasingly anxious. It seemed like I needed to do a lot of things that didn't feel productive. Less and less of my time was spent pairing and writing code as I was busy in meetings, replying to emails, answering questions from stakeholders, etc. I felt as if every story with my name on it wasn't progressing. My response was to sacrifice my personal time to make up for what I'd missed due to these distractions (as I perceived them). I quickly became overworked.
>
> What I hadn't realized when I moved from a techie to tech lead, was how my responsibilities and metrics for success...had changed.
>
> Peter Gillard-Moss' ([Techie to tech lead: My five biggest mistakes](https://www.thoughtworks.com/insights/blog/techie-tech-lead-my-5-biggest-mistakes))

The signals for success change - so if you *feel* like you're not as successful as you were
as a software developer, make sure you're measuring the right things for DevOps.

### Empathy takes work

Being DevOps requires a willingness to ***learn*** about and ***solve*** problems
developers and operations both face. Without that willingness, silos will form. If silos
form, it's not DevOps anymore.

Empathy is what allows us to feel Developer's pain and know Operation's struggles. And it
takes work to grow that understanding.

Some ways to grow empathy with Developers:

* Present infrastructure overviews
* Allow Developer contributions to infrastructure as code
* Dogfood the same release pipeline Developers use to make versioned infrastructure changes
* Attend Developer product demos and give feedback
* Give DevOps product demos and get feedback

Interview with the Programmer
#############################

:date: 2022-01-13 17:04
:tags: interview

.. image:: images/interview.jpg
    :alt: wooden desk with typewriter
    :class: image-process-article-image
    :align: center

Hiring a good programmer is hard. Not “come up with clever LeetCode puzzles” hard — actually *figuring out how someone thinks* hard.

Over the years I’ve seen a few interview styles that really stuck with me. These aren’t about trick questions or whiteboard gymnastics. They’re about getting a glimpse into how someone approaches real problems. Here are three of my favourites:

"Tell me about your project, and I'll tell you who you are..."
================================================================

In `this simulated interview <https://www.youtube.com/watch?v=cfyWvJdsDRI>`_, Shawn McGrath walks Casey Muratori through his custom anti-aliasing implementation. Casey plays the role of a genuinely curious engineer and just keeps asking *why* and *how*.

What I like about this approach is how naturally it exposes depth. You can tell very quickly whether someone really understands the trade-offs they made, or if they just followed a tutorial and hoped for the best. Unlike toy algorithm problems, talking through a real project shows how a programmer thinks when things get messy—which is, let’s be honest, most of the job.

"Found this bug. What could have caused it?"
=============================================

Hussein Nasser talks about `his favorite interview question <https://www.youtube.com/watch?v=bDIB2eIzIC8>`_, and it’s a great one. He starts by sketching out a system - database, backend, reverse proxy, load balancer, frontend—and then drops a concrete problem on the table. For example: *the UI freezes for about a minute after clicking a button*.

From there, the candidate is free to explore. How would you debug this? Where would you start? What do you suspect?

What’s clever here is that it’s completely open-ended. People naturally gravitate toward the parts of the system they understand best, and that tells you a lot. According to Hussein, he’s never gotten the same answer twice—and that tracks with my experience too.

"Here's the source code. Add a feature..."
=============================================
    
In `this interview write-up <https://quuxplusone.github.io/blog/2022/01/06/memcached-interview/>`_, the task is to add support for an atomic **mult** command to `Memcached <https://memcached.org>`_.

I love this style because it’s unapologetically practical. You’re dropped into an unfamiliar codebase and asked to make a real change. No puzzles, no brainteasers - just: *can you read code, reason about it, and ship something without panicking?*

This kind of exercise tends to surface pragmatic programmers - the ones who aren’t afraid to get their hands dirty, ask the right questions, and make progress even when everything isn’t perfectly documented.
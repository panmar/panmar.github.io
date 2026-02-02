Close Encounters of the MinHash Kind
####################################
:date: 2023-07-14 21:33
:tags: algorithm

.. image:: images/cat_twins.jpeg
    :alt: Two cats that look identical
    :class: image-process-article-image
    :align: center

Imagine you're building a meme recommendation system. Users upload memes, and your task is to find all similar ones quickly. A meme is described by a set of features, e.g., ["*sun*", "*dog*", "*car*"]. Memes are considered similar if they share most of their features:

.. code-block:: python

    meme_1 = ["floor", "sun", "dog", "car"]     # similar to meme_2
    meme_2 = ["sun", "ball", "dog", "car"]      # similar to meme_1

    meme_3 = ["tree", "grass", "dog"]           # different from both

How would you find all similar memes?

A straightforward approach would be to directly compare every meme with every other meme. However, for N memes, this results in O(N²) comparisons — clearly not efficient. We can do better!

The Intuition
*************

Let's think about it. If two memes share most of their features, then picking a random feature from the combined set has a high chance of being present in both. If we repeat this process multiple times, similar memes will match more frequently than different ones.

This gives us the core insight, but random sampling has a practical drawback: we'd need to coordinate and store our random choices to ensure consistency across comparisons. What if we could achieve the same effect deterministically?

From Random Sampling to Hashing
*******************************

What if, instead of picking features at random, we defined a consistent rule for selecting *one* feature from each meme? Here's the trick: use a hash function.

A hash function maps each feature to a number, giving us an implicit ordering. For each meme, we hash all its features and keep only the **minimum** hash value. This is called the *min-hash* of that meme.

.. code-block:: python

    def min_hash(features, hash_func):
        return min(hash_func(f) for f in features)

Why does this help? If two memes are similar (they share most of their features), they're likely to agree on which feature has the minimum hash — because they're mostly hashing the same set!

More precisely, the probability that two memes have the same min-hash equals their `Jaccard similarity <https://en.wikipedia.org/wiki/Jaccard_index>`_ (the size of their intersection divided by the size of their union).

A Concrete Example
******************

Let's see this in action. Suppose our hash function produces these values:

.. code-block:: python

    # hash("sun")=3, hash("dog")=7, hash("car")=12,
    # hash("floor")=25, hash("ball")=9, hash("tree")=1, hash("grass")=15

    meme_1 = ["floor", "sun", "dog", "car"]  # min_hash = 3  (from "sun")
    meme_2 = ["sun", "ball", "dog", "car"]   # min_hash = 3  (from "sun") ✓ match!
    meme_3 = ["tree", "grass", "dog"]        # min_hash = 1  (from "tree")

With this particular hash function, ``meme_1`` and ``meme_2`` have the same min-hash, while ``meme_3`` differs. But one hash function isn't enough — we might get unlucky. The solution? Use many hash functions.

Building a Signature
********************

If we repeat this process using **k** different hash functions, we get a *signature* for each meme: a vector of **k** min-hash values.

.. code-block:: python

    def compute_signature(features, hash_functions):
        return [min_hash(features, h) for h in hash_functions]

    # Using 100 hash functions, each meme gets a signature of 100 integers
    sig_1 = compute_signature(meme_1, hash_functions)  # [3, 42, 7, 91, ...]
    sig_2 = compute_signature(meme_2, hash_functions)  # [3, 42, 7, 18, ...]
    sig_3 = compute_signature(meme_3, hash_functions)  # [1, 55, 2, 36, ...]

The fraction of positions where two signatures match estimates their Jaccard similarity. In the example above, ``sig_1`` and ``sig_2`` might match in 75 out of 100 positions, while ``sig_1`` and ``sig_3`` might match in only 10.

Now, instead of comparing full feature sets, we compare compact integer vectors — much faster!

Conclusion
**********

`MinHash <https://en.wikipedia.org/wiki/MinHash>`_ turns an O(N²) comparison problem into something much more manageable. Instead of comparing every meme to every other meme, we compute a small signature for each meme in O(N × k) time, where **k** is the number of hash functions.

Memes with similar signatures are likely to be similar — and we can find them efficiently using techniques like `Locality-Sensitive Hashing <https://en.wikipedia.org/wiki/Locality-sensitive_hashing>`_ (LSH), which buckets signatures so that similar items land in the same bucket with high probability.

This family of techniques powers similarity search at scale: near-duplicate detection, recommendation systems, plagiarism detection, and more. Not bad for a bit of hashing!
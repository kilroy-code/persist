# @kilroy-code/Persist

> Dead simple experimeental persistence.

**Under development. Do not use.**

Currently:

- Payloads are JSON.
- Each `post` is simply stored by tag, directly in the file system in a flat directory corresponding to the route. (E.g., 'user/_tag_.json', 'group/_tag_.json')
- These files are then available to `get` by tag as static files by the same pathnames.
- An additional `get` route is defined that answers an array of the tags in that route. There is no paging of long results. (E.g., 'user/list.json', 'group/list.json'.)
- Requests are queued and files renamed during writes.
- Later on, stores wills will have to be signed and are deep-verified by the server, but not yet. (Per [here](https://github.com/kilroy-code/distributed-security/blob/main/docs/in-jose-terms.md#7-auditable-signatures-and-deep-verification) and [here](https://github.com/kilroy-code/distributed-security/blob/main/docs/advanced.md#signatures-with-multiple-tags-and-other-signature-options).)

So,... right now:
- No security.
- Cannot handle more than a directory full. Say, 1000. (Need to partition into subdirectories using well-distributed tags and handle tag lists maintenance more explicitly, with paging. Or... use a key-value backing store.)
- No parallelization of requests. (Need to use a key-value backing store.)

I expect this to eventually be unified with the [Signed Cloud Server](https://github.com/kilroy-code/signed-cloud-server?tab=readme-ov-file#signed-cloud-server), which is simple and robust, but only handles the needs of storing verified [JWK](https://datatracker.ietf.org/doc/html/rfc7517) as used by [Distributed Security](https://github.com/kilroy-code/distributed-security?tab=readme-ov-file#distributed-security).


## Setup

Logging, cors, etc. are all handled by the app. This is just the routes specific to this service. Use as, e.g.:

```
import * as persist from '@kilroy-code/persist';
app.use('/persist', persist);
```

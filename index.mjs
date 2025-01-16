import path from 'node:path';
import fs from 'node:fs/promises';
import express from 'express';
const {default:nocache} = await import('nocache');

// See README.md

const router = express.Router();
const serverPath = path.dirname(new URL(import.meta.url).pathname), // Does not include module filename.
      dbPath = path.resolve(serverPath, 'db');
var queue = Promise.resolve();

queue = queue
  .then(() => fs.mkdir(`${dbPath}/user`, {recursive: true}))
  .then(() => fs.mkdir(`${dbPath}/group`, {recursive: true}));

function answerEmptyJSON(req, res) {
  // Middlware to answer json. It doesn't matter what we respond with, although of course we must respond with something.
  res.send({});
}

function enqueueRequest(req, res, next) { // Middleware to adds the req to a common FIFO queue.
  // Some requests (such as storing data) might not need to respond with a particularly meaningful value,
  // and so those requests could return right away after enqueue work to be done later.
  // But it is much kinder and more orderly to not send back a response until the work has
  // been completed. That's what happens when you use this at the head of a route.
  queue = queue.then(next);
}
async function listCollectionKeys(req, res, next) {
  const {collectionName} = req.params,
	dirname = `${dbPath}/${collectionName}`,
	entries = await fs.readdir(dirname),
	tags = entries.map(filename => path.basename(filename, '.json'));
  res.send(tags);
}
async function storeInCollection(req, res, next) {
  if (req.headers['content-type'] !== 'application/json') return res.status(415).send('Requires JSON'); // Be nice for common mistake.

  // Store verified body by either writing it to a file or removing the file (if there's no content).
  // Requires req.verified to be set.
  try {
    const {body} = req,
	  {collectionName, tag} = req.params,
	  pathname = `${dbPath}/${collectionName}/${tag}.json`;
    if (body) {
      await fs.writeFile(pathname, body, {flush: true});
    } else {
      // Subtle: If there's no verifiedContent, we delete the file. But some implementations of unlink resolve before
      // the file system has truly flushed the data. That can result in (await Security.destroy(); await Security.retrieve())
      // producing the old data! We handle this by moving the file out of the way and then deleting that.
      const alt = pathname + '.DEL';   // Because of request queueing, overlapping requests to the same tag will have "completed" unlink before next rename.
      await fs.rename(pathname, alt);
      await fs.unlink(alt);
    }
    next();
  } catch (e) {
    next(e);
  }
}

router.use(nocache()); // All stored objects are mutable.
router.use(express.text({ // Define req.body, but don't use broken express.json parser that does not handle toplevel non-objects.
  type: 'application/json',
  limit: '5mb'
})); 
router.get('/:collectionName/list.json', enqueueRequest, listCollectionKeys);
router.use('/', express.static(dbPath));
router.post('/:collectionName/:tag.json', enqueueRequest, storeInCollection, answerEmptyJSON);

export default router;

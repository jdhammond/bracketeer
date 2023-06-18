import { Router } from 'express';
import tournamentController from '../controllers/tournamentController.js';

export const tournamentRouter = Router();

// throwing errors from middleware
tournamentRouter.get(
  '/:tournamentID',
  tournamentController.getData,
  (req, res) => {
    // imagining what this will eventually return
    // should this return just the tournament? return all the matchups associated with the tournamnet?
    // might need to be two routes
    res.status(200).json(res.locals);
  }
);
tournamentRouter.post('/', tournamentController.create, (req, res) => {
  res.sendStatus(201);
});

tournamentRouter.patch('/votes', tournamentController.addVotes, (req, res) => {
  res.sendStatus(200);
});

// throw errors from middleware
tournamentRouter.delete(
  '/:tournamentID',
  tournamentController.deleteTournament,
  (req, res) => {
    res.sendStatus(204);
  }
);
// only for development
tournamentRouter.delete('/all', tournamentController.clearData, (req, res) =>
  res.sendStatus(204)
);

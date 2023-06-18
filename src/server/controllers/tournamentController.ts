import { Controller, MatchUpInput } from '../../types';
import { Tournament } from '../models/tournament.js';
import { MatchUp } from '../models/matchUp.js';
import { Contestant } from '../models/contestant.js';

const tournamentController: Controller = {};

// just a placeholder for now to quiet the Typescript errors
tournamentController.getData = async (req, res, next) => {
  const { tournamentID } = req.params;
  try {
    res.locals.tournament = await Tournament.findById(tournamentID);
    res.locals.matchUps = await MatchUp.find({ tournament: tournamentID });
    return next();
  } catch (err) {
    return next({
      log: `Error from tournamentController.getData: ${err}`,
      status: 500,
      message: { err: 'Failed to get bracket data' },
    });
  }
};

// delete one tournament
tournamentController.deleteTournament = async (req, res, next) => {
  const { tournamentID } = req.params;
  try {
    console.log('Deleting tournament ', tournamentID);
    res.locals.matchUps = await MatchUp.deleteMany({
      tournament: tournamentID,
    });
    res.locals.tournament = await Tournament.findByIdAndRemove(tournamentID);
    return next();
  } catch (err) {
    return next({
      log: `Error from tournamentController.deleteTournament: ${err}`,
      status: 500,
      message: { err: 'Failed to delete tournament' },
    });
  }
};

// Only for testing/dev
tournamentController.clearData = async (req, res, next) => {
  console.log('delete time');
  try {
    await MatchUp.deleteMany({});
    await Tournament.deleteMany({});
    return next();
  } catch (err) {
    return next({
      log: `Error from tournamentController.deleteMatchUps: ${err}`,
      status: 500,
      message: { err: 'Unable to delete data' },
    });
  }
};

tournamentController.create = async (req, res, next) => {
  // req.body should have a string array of contestants in seeded order, strongest to weakest
  console.log(req.body);
  const { contestants, roundInterval, displayVotesDuringRound } = req.body;

  try {
    const tournament = await Tournament.create({
      createTime: Date.now(), // unix timestamp
      roundInterval,
      displayVotesDuringRound,
    });
    console.log(tournament);
    const tournamentID = tournament._id;

    // use connectDocsInTree logic
    // get number of rounds in this tournament:

    let round = Math.log2(req.body.contestants.length);

    // subtract 1 here beacuse the pre-increment isn't working in the .create() statements below. An async issue?
    let currentMatchNumber = round ** 2 - 1;

    // make head node
    await MatchUp.create({
      tournament: tournamentID,
      round,
      next: undefined,
      matchNumber: --currentMatchNumber,
    });

    // indices for seeding
    let j = 0,
      k = contestants.length - 1;

    // make a new row below the current row
    while (round > 1) {
      const currentRow = await MatchUp.find({
        round,
        tournament: tournamentID,
      });

      // use for loop - forEach doesn't work asynchronously
      for (let i = 0; i < currentRow.length; i++) {
        const props: MatchUpInput[] = [
          {
            tournament: tournamentID,
            round: round - 1,
            next: currentRow[i].matchNumber,
            matchNumber: --currentMatchNumber,
          },
          {
            tournament: tournamentID,
            round: round - 1,
            next: currentRow[i].matchNumber,
            matchNumber: --currentMatchNumber,
          },
        ];

        // for each matchup in the first round: create two contestants for each matchup and associate them w/_id
        if (round === 2) {
          // for loop to avoid async/forEach problems
          for (let i = 0; i < props.length; i++) {
            props[i].contestant1 = {
              name: contestants[j],
              seed: j + 1,
            };

            props[i].contestant2 = {
              name: contestants[k],
              seed: k + 1,
            };
            // walk pointers in from the left and right of the array of contestants so that stronger and weaker seeds are matched against each other
            j++;
            k--;
          }
        }

        await MatchUp.insertMany(props);
      }
      round--;
    }
    return next();
  } catch (err) {
    return next({
      log: `Error from tournamentController.create: ${err}`,
      status: 400,
      message: { err: 'Failed to create tournament data' },
    });
  }
};

tournamentController.addVotes = async (req, res, next) => {
  //eventually, logic needed so that a user can only vote 1x/round/tournament
  const { tournamentID, selected } = req.body;
  console.log('ADDVOTES: ', tournamentID, selected);

  try {
    for (const key in selected) {
      if (selected[key] === 0) continue;
      const query = { matchNumber: key, tournament: tournamentID };
      const incrementObject =
        selected[key] === 1 ? { contestant1votes: 1 } : { contestant2votes: 1 };
      const matchUp = await MatchUp.findOne(query);
      console.log('updating matchup # ', matchUp?.matchNumber);

      const updated = await MatchUp.findOneAndUpdate(query, {
        $inc: incrementObject,
      }).lean();

      console.log(updated);
    }
    return next();
  } catch (err) {
    return next({
      log: `Error from tournamentController.addVotes: ${err}`,
      status: 400,
      message: { err: 'Failed to create tournament data' },
    });
  }
};

export default tournamentController;

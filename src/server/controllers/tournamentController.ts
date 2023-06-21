import {
  ContestantType,
  Controller,
  MatchUpInput,
  MatchUpType,
} from '../../types';
import { Tournament } from '../models/tournament.js';
import { MatchUp } from '../models/matchUp.js';

const tournamentController: Controller = {};

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
    // get number of rounds in this tournament:
    let round = Math.log2(req.body.contestants.length);

    const tournament = await Tournament.create({
      createTime: Date.now(), // unix timestamp
      roundInterval,
      displayVotesDuringRound,
      currentRound: 1,
      lastRound: round,
    });
    console.log(tournament);
    const tournamentID = tournament._id;

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
      message: { err: 'Failed to add votes to tournament' },
    });
  }
};

tournamentController.nextRound = async (req, res, next) => {
  const { id } = req.body;
  console.log(`Advancing tournament ${id}...`);
  try {
    // get tournament by id and its matchups
    const tournament = await Tournament.findById(id);
    console.log(tournament);
    const matchUps = await MatchUp.find({
      tournament: id,
      round: tournament!.currentRound,
    });

    // increment its current round if last round not reached
    if (tournament!.currentRound <= tournament!.lastRound + 1) {
      tournament!.currentRound += 1;
      tournament!.save();

      console.log('tournament current round is now ', tournament!.currentRound);

      // for each matchup, choose the contestant with more votes
      let winner: undefined | ContestantType;
      for (let i = 0; i < matchUps.length; i++) {
        if (matchUps[i].contestant1votes! > matchUps[i].contestant2votes!) {
          winner = matchUps[i].contestant1;
        } else if (
          matchUps[i].contestant1votes! < matchUps[i].contestant2votes!
        ) {
          winner = matchUps[i].contestant2;
        } else {
          // if votes are tied, decide randomply
          winner =
            Math.random() > 0.5
              ? matchUps[i].contestant1
              : matchUps[i].contestant2;
        }

        // if this was the last round, declare a winner
        // should tournament object have a winner property?
        if (tournament!.currentRound === tournament!.lastRound + 1) {
          console.log(`The winner is ${winner!.name}!`);
          return next();
        }

        // if matchup index is even, assign winning contestant to contestant1 of next; if odd, contestant2;
        const nextMatch = await MatchUp.findOne({
          tournament: id,
          matchNumber: matchUps[i].next,
        });
        if (i % 2 === 0) {
          nextMatch!.contestant1 = winner;
        } else {
          nextMatch!.contestant2 = winner;
        }
        await nextMatch!.save();
      }
    } else {
      throw new Error('Round number is out of bounds for this tournament');
    }
    return next();
  } catch (err) {
    return next({
      log: `Error from tournamentController.nextRound: ${err}`,
      status: 400,
      message: { err: 'Failed to got to next round' },
    });
  }
};

// tournamentController.previousRound = async (req, res, next) => {
//   const { id } = req.body;
//   console.log(`rewinding tournament ${id}`);
//   try {
//     // get tournament by id and its matchups
//     const tournament = await Tournament.findById(id);
//     const matchUps = await MatchUp.find({
//       tournament: id,
//       round: tournament!.currentRound,
//     });

//     // clear contestants and votes from from currentRound matchups
//     for (let i = 0; i < matchUps.length; i--) {
//       matchUps[i].contestant1 = undefined;
//       matchUps[i].contestant2 = undefined;
//       matchUps[i].contestant1votes = 0;
//       matchUps[i].contestant2votes = 0;
//       await matchUps[i].save();
//     }

//     // decrement round
//     if (tournament!.currentRound > 1) {
//       tournament!.currentRound = tournament!.currentRound - 1;
//       tournament!.save();
//     } else {
//       console.log(
//         "This is the first round of the tournament, there's no round before it"
//       );
//     }

//     next();
//   } catch (err) {
//     return next({
//       log: `Error from tournamentController.previousRound: ${err}`,
//       status: 400,
//       message: { err: 'Failed to go to previous round' },
//     });
//   }
// };

export default tournamentController;

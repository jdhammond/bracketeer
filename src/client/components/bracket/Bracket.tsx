import {
  useState,
  useEffect,
  useLayoutEffect,
  useReducer,
  MouseEvent,
  useCallback,
} from 'react';

import axios, { AxiosError } from 'axios';

import { MatchUpType, SelectionObject } from '../../../types';

import RoundColumn from '../RoundColumn';
import updateDisplay from './reducer';
import processMatchups from './processMatchups';

import initialDisplayState from './initialDisplayState';

// temporary
const TEST_TOURNAMENT_URI = '64863e1bf5a5d7a132318e76';

const Bracket = () => {
  const [displayState, displayDispatch] = useReducer(
    updateDisplay,
    initialDisplayState
  );

  const [matchUpResponse, setMatchUpResponse] = useState<MatchUpType[]>([]);
  const [matchUps, setMatchUps] = useState<MatchUpType[][]>([]);
  const [selected, setSelected] = useState<SelectionObject>({});
  const [displayVotes, setDisplayVotes] = useState<boolean>(false);
  const [round, setRound] = useState<number>(1);

  // //useCallback?

  const getMatchUps = async (id: string) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/tournament/${id}`
      );
      console.log('axios res: ', response.data);
      setMatchUpResponse(response.data.matchUps);
    } catch (err) {
      if (err instanceof AxiosError) {
        console.log(err.response);
      } else {
        console.log(err);
      }
    }
  };

  // tournament should have a currentRound property, maybe?
  // more semantic but another failure point to calculate the round server-side
  // but also the server has to get involved at some point to advanced contestants
  // hard-code test tournament id for now
  useEffect(() => {
    getMatchUps(TEST_TOURNAMENT_URI);
  }, []);

  useEffect(() => {
    displayDispatch({
      type: 'updateDisplay',
      payload: {
        unidirectional: displayState.unidirectional,
        numberOfMatchUps: matchUpResponse.length,
      },
    });

    // make object to store user's votes in current round
    // 0 = no vote, 1 = contestant1, 2 = contestant2
    const selections: SelectionObject = {};
    matchUpResponse.filter((el) => {
      if (el.round === round) {
        selections[String(el.matchNumber)] = 0;
      }
    });
    setSelected(selections);
  }, [matchUpResponse]);

  // create matchUps object whose keys are round numbers and whose values are the array of matchups for each column
  useLayoutEffect(() => {
    // sorting logic moves to here
    // arrays? destructuring?
    // add column keys in render function
    const matchUpData = processMatchups(matchUpResponse, displayState);
    setMatchUps(matchUpData);
  }, [displayState, matchUpResponse]);

  // only redefine this function when the user has changed their selections
  const updateSelections = useCallback(
    (e: MouseEvent) => {
      console.log(selected);
      // the id of the event target is in the form #-#. The first number is the matchup number. The second number is 0 (for no selection), 1, or 2 (for the first or second choice)
      const [matchNumber, choice] = (e.target as Element)
        .parentElement!.id.split('-')
        .map((el) => Number(el));
      const newSelected = { ...selected };
      if (selected[matchNumber] === choice) newSelected[matchNumber] = 0;
      else newSelected[matchNumber] = choice;
      console.log('NS:', newSelected);
      setSelected(newSelected);
    },
    [selected]
  );

  const sendVotes = async (selected: SelectionObject) => {
    try {
      console.log('AXIOS PATCH: ', selected);
      const data = {
        tournamentID: TEST_TOURNAMENT_URI,
        selected,
      };
      const response = await axios.patch(
        'http://localhost:8000/tournament/votes',
        data
      );
      console.log(response);
      getMatchUps(TEST_TOURNAMENT_URI);
    } catch (err) {
      if (err instanceof AxiosError) {
        console.log(err.response);
      } else {
        console.log(err);
      }
    }
  };

  return (
    <div>
      <div className='bracket-render-grid' style={displayState.displaySettings}>
        {matchUps.map((column, index) => {
          return (
            <RoundColumn
              key={index}
              columnData={column}
              currentRound={round}
              selected={selected}
              updateSelections={updateSelections}
            />
          );
        })}
      </div>
      <button
        onClick={() =>
          displayDispatch({
            type: 'updateDisplay',
            payload: {
              unidirectional: !displayState.unidirectional,
              numberOfMatchUps: matchUpResponse.length,
            },
          })
        }
      >
        Toggle View
      </button>
      <button onClick={() => setRound(() => round + 1)}>
        TEST: Next Round
      </button>
      <button onClick={() => setRound(() => round - 1)}>
        TEST: Previous Round
      </button>
      <button onClick={() => sendVotes(selected)}>Submit votes</button>
    </div>
  );
};

export default Bracket;

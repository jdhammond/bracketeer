import {
  useState,
  useEffect,
  useLayoutEffect,
  useReducer,
  MouseEvent,
  useCallback,
} from 'react';
import testTournamentData from '../../../assets/test_data/test-tournament';
import RoundColumn from '../RoundColumn';
import updateDisplay from './reducer';
import axios from 'axios';
import { MatchUpType, SelectionObject } from '../../../types';
import processMatchups from './processMatchups';
import initialDisplayState from './initialDisplayState';

const Bracket = () => {
  // combine state updates with useReducer?

  const [displayState, displayDispatch] = useReducer(
    updateDisplay,
    initialDisplayState
  );

  const [isLoading, setIsLoading] = useState(true);
  // use this vv rather than isLoading to avoid redudancy?
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
      console.log(err);
    }
  };

  // tournament should have a currentRound property, maybe?
  // more semantic but another failure point to calculate the round server-side
  // but also the server has to get involved at some point to advanced contestants
  // hard-code test tournament id for now
  useEffect(() => {
    getMatchUps('64863e1bf5a5d7a132318e76');
  }, []);

  useEffect(() => {
    console.log('USEEFFECT');
    console.log(matchUpResponse);
    if (matchUpResponse.length) setIsLoading(false);
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
    console.log(selections);
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
      const [matchNumber, choice] = (e.target as Element).id
        .split('-')
        .map((el) => Number(el));
      const newSelected = { ...selected };
      if (selected[matchNumber] === choice) newSelected[matchNumber] = 0;
      else newSelected[matchNumber] = choice;
      console.log('NS:', newSelected);
      setSelected(newSelected);
    },
    [selected]
  );

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

        {Object.keys(matchUps)
          // if bracket has left and right wings, sort columns of matchups accordingly
          .sort((a, b) => (a[0] === 'l' ? 1 : -1))
          .map((round, index) => {
            return <RoundColumn key={index} roundData={matchUps[round]} />;
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
    </div>
  );
};

export default Bracket;

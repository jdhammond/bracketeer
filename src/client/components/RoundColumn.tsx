import Xarrow from 'react-xarrows';
import { useXarrow, Xwrapper } from 'react-xarrows';
import { useEffect, MouseEvent } from 'react';
import { MatchUpType, SelectionObject } from '../../types';

const RoundColumn = (props: {
  columnData: MatchUpType[];
  currentRound: number;
  selected: SelectionObject;
  updateSelections: (e: MouseEvent) => void;
}) => {
  const { columnData, currentRound, updateSelections, selected } = props;
  const updateXarrow = useXarrow();
  // when roundData changes, redraw arrows based on new positions of matchup divs
  useEffect(() => {
    updateXarrow();
  }, [props]);

  // const handleHover: MouseEventHandler = (e) => {
  //   if (e.target) (e.target as HTMLElement).innerHTML = 'hovered!';
  // };

  columnData.sort((a, b) => b.matchNumber - a.matchNumber);

  return (
    <div className='round-column'>
      {columnData.map((el, index) => {
        return (
          <div
            className={`matchup-container ${
              el.round === currentRound ? 'active' : 'inactive'
            }`}
            id={`matchup${el.matchNumber}`}
            key={index}
          >
            <div
              className={
                'contestant-container A' +
                (selected[el.matchNumber] === 1 ? ' selected' : '')
              }
              id={`${el.matchNumber}-1`}
              onClick={updateSelections}
            >
              <div className='contestant-name'>
                {el.contestant1 && el.contestant1.name}
              </div>
              <div className='contestant-votes'>
                {el.contestant1 && el.contestant1votes}
              </div>
            </div>
            <div
              className={
                'contestant-container B' +
                (selected[el.matchNumber] === 2 ? ' selected' : '')
              }
              id={`${el.matchNumber}-2`}
              onClick={updateSelections}
            >
              <div className='contestant-name'>
                {el.contestant2 && el.contestant2.name}
              </div>
              <div className='contestant-votes'>
                {el.contestant2 && el.contestant2votes}
              </div>
            </div>
            {el.next && (
              <Xwrapper>
                <Xarrow
                  start={`matchup${el.matchNumber}`}
                  end={`matchup${el.next}`}
                  path='grid'
                  headSize={3}
                />
              </Xwrapper>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RoundColumn;

import { Schema, Types } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { Dispatch, SetStateAction } from 'react';
import { IntegerType } from 'mongodb';

export interface Controller {
  [k: string]: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void> | void;
}

export interface errorObject {
  log: string;
  status: number;
  message: { err: string };
}

export interface BracketType {
  contestant: string | undefined;
  votes: number;
  left: BracketType | null;
  right: BracketType | null;
  round: number;
}

export interface BracketConstructor {
  (contestants: string[] | null, round: number): BracketType;
}

export interface DepthWrapperType {
  depth: (root: BracketType | null) => number;
}

// consolidate these two interfaces - one can prob extend the other
export interface MatchUpInput {
  tournament: Types.ObjectId;
  contestant1?: ContestantType;
  contestant2?: ContestantType;
  round: number;
  next: number;
  matchNumber: number;
}

export interface MatchUpType {
  ObjectId: Types.ObjectId;
  tournament: Types.ObjectId; //?
  contestant1?: ContestantType;
  contestant2?: ContestantType;
  contestant1votes?: number;
  contestant2votes?: number;
  next?: number;
  round: number;
  matchNumber: number;
}

export interface ContestantType {
  name: String;
  seed: number;
}

// consider this drafty
export interface TournamentType {
  createTime: number; // unix timestamp
  roundInterval: number; //number?
  displayVotesDuringRound: boolean;
  // createdBy: User;
  // openToAll: boolean;
  // participants: User[]s <== actually, each user should have an array of associated tournament ids - much faster
  // winner - for easier re-access to winner later, if that's anything that matters?
  // (we might want an option for it to be open to any user -- could use an empty participant list for this, or add a prop for it)
}

export interface ContestantsPostType {
  contestants: String[];
  roundInterval?: IntegerType;
  displayVotesDuringRound?: Boolean;
}

export interface SliderProps {
  sliderVal: number;
  setSliderVal: Dispatch<SetStateAction<number>>;
}

export interface ContestantNameAndIndex {
  name: string;
  index: number;
}

export interface ContestantProps {
  sliderVal: number;
  contestants: ContestantNameAndIndex[];
  setContestants: Dispatch<SetStateAction<ContestantNameAndIndex[]>>;
}

export interface InputProps extends ContestantProps {
  setSliderVal: Dispatch<SetStateAction<number>>;
}

export interface displayStateProps {
  unidirectional: boolean;
  numberOfColumns: number;
  displaySettings: bracketDisplaySettings;
}

export interface bracketDisplaySettings {
  gridTemplateColumns: string;
  columnGap: string;
}

export interface UserType {
  email: String
  hashedPassword: String
  token: String
  createdBrackets:TournamentType[]
  invitedBrackets: TournamentType[]
}

export interface SelectionObject {
  [k: string]: number;
}

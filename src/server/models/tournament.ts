import { Schema, model } from 'mongoose';
import { TournamentType, ContestantType } from '../../types';

const TournamentSchema: Schema = new Schema<TournamentType>({
  createTime: Number,
  roundInterval: { type: Number, default: 24 * 60 * 60 * 1000 }, // default: 1 day in ms
  displayVotesDuringRound: { type: Boolean, default: true },
  // currentRound: Number,
  // lastRound: Number,
  // eventually add other props from types.ts -- leaving out for now
});

export const Tournament = model<TournamentType>('tournament', TournamentSchema);

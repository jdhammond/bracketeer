import { Timestamp } from "mongodb"
import { Schema, model } from "mongoose"
import { UserType, BracketType } from "../../types"
import { Tournament } from "./tournament"

const UserSchema: Schema = new Schema<UserType>(
	{
		email: {
			type: String,
			required: true,
			unique: true,
		},
		hashedPassword: {
			type: String,
			required: true,
		},
		token: String,
		createdBrackets: [Tournament],
		invitedBrackets: [Tournament],
	},
	{
        timestamps: true,
		toObject: {
			
			transform: (_doc, user) => {
				delete user.hashedPassword
				return user
			},
		},
	}
)

export const User = model<UserType>("user", UserSchema)

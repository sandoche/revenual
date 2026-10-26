import mongoose from 'mongoose'

export type PreRegisteredUserDocument = mongoose.Document & {
    email: string;
}

export const preRegisteredUserSchema = new mongoose.Schema({
    email: {
        type: String,
        trim: true,
        lowercase: true,
        required: true,
        validate: {
            validator: (v: any): boolean => {
                // eslint-disable-next-line 
                return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v)
            }
        }
    }
})

export const PreRegisteredUser = mongoose.model<PreRegisteredUserDocument>('PreRegisteredUser', preRegisteredUserSchema)

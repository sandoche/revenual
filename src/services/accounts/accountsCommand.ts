import { AwilixContainer } from 'awilix'
import { UserDocument } from '../../models/User'
import { AccountDocument } from '../../models/Account'
import mongoose from 'mongoose'

const getAccounts = async (container: AwilixContainer, userId: string) => {
    const createError: any = container.resolve('createError')

    try {
        const logger: any = container.resolve('logger')
        const User: mongoose.Model<UserDocument> = container.resolve('User')
        const accountsFactory: any = container.resolve('accountsFactory')
        const providers: any =  container.resolve('providers')

        logger.info('Getting all the providers', { providers })
        const providerList = accountsFactory.getProviders(providers)

        logger.info('Getting user with accounts', { userId })
        const user = await User.findOne({ _id: userId }).populate('accounts').exec()

        logger.info('Getting all the accounts added and their validity', { user: userId })
        const validatedAccounts = await accountsFactory.getAccountsWithValidation(user.accounts)

        return {
            providerList,
            validatedAccounts
        }
    } catch (err) {
        const error = createError(err)
        throw error
    }
}

const addAccount = async (container: AwilixContainer, provider: any, providerName: string, email: string, password: string, code: string, uri: string, userId: string) => {
    const createError: any = container.resolve('createError')
  
    try {
        const AppError: any = container.resolve('AppError')
        const errorTypes: any = container.resolve('errorTypes')
        const appErrorTypes: any = container.resolve('appErrorTypes')
        const parseUri: any = container.resolve('parseUri')
        const Account: mongoose.Model<AccountDocument> = container.resolve('Account')
        const User: mongoose.Model<UserDocument> = container.resolve('User')

        const token = await provider.getToken({ email, password, code, uri })
        const id = email ? email : parseUri(uri)

        const account = new Account({
            type: providerName,
            credentials: token,
            id: id,
            createdAt: new Date()
        })

        const user = await User.findById(userId).exec()
        const existingAccount = await Account.findOne({ id }).exec()

        if(existingAccount) {
            throw new AppError(errorTypes.ValidationError, appErrorTypes.ExistingAccount,'This account has already been added', true, true, { userId })
        }

        account.user = user
        if (Array.isArray(user.accounts)) {
            user.accounts.push(account)
        } else {
            user.accounts = [account]
        }

        await account.save()
        await user.save()

    } catch (err) {
        const error = createError(err)
        throw error
    }
}

const deleteAccount = async (container: AwilixContainer, providerId: string, userId: string) => {
    const createError: any = container.resolve('createError')

    try {
        const Account: mongoose.Model<AccountDocument> = container.resolve('Account')
        const User: mongoose.Model<UserDocument> = container.resolve('User')

        const account = await Account.findOne({ _id: providerId }).exec()
        if (account.user._id == userId) {
            const user: any = await User.findById(userId).exec()
            const accountToRemoveIndex = user.accounts.indexOf(providerId) 
            const ACCOUNT_FOUND = -1
            const GET_ONE_ITEM = 1
            if (accountToRemoveIndex > ACCOUNT_FOUND) {
                user.accounts.splice(accountToRemoveIndex, GET_ONE_ITEM)
            }
            await account.remove()
            await user.save()
        }
    } catch (err) {
        const error = createError(err)
        throw error
    }
}

export default {
    getAccounts,
    addAccount,
    deleteAccount
}
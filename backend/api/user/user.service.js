const dbService = require('../../services/db.service')
const reviewService = require('../review/review.service')
const ObjectId = require('mongodb').ObjectId

module.exports = {
    query,
    getById,
    getByUserName,
    remove,
    update,
    add,
    // query2
}

async function query() {
    try {
        console.log('service query');
        
        const collection = await dbService.getCollection('users')
        const users = await collection.find().toArray();
        console.log('users', collection);

        return users
    } catch (err) {
        console.log('ERROR: cannot find users')
        throw err;
    }
}

// async function query2() {
//     try {
//         const collection = await dbService.getCollection('board')
//         // const board = await collection.find({ "members._id": "u101" }).toArray()
//         const board = await collection.find({ "members": "u101" }).toArray()
//         console.log('BOOOARDD', board);
//         return board
//     } catch (err) {
//         console.log('ERROR: cannot find users')
//         throw err;
//     }
// }

// async function query(filterBy = {}) {
//     const criteria = _buildCriteria(filterBy)
//     const collection = await dbService.getCollection('user')
//     try {
//         const users = await collection.find(criteria).toArray();
//         // users.forEach(user => delete user.password);

//         return users
//     } catch (err) {
//         console.log('ERROR: cannot find users')
//         throw err;
//     }
// }

async function getById(userId) {
    console.log('getById', userId)
    const collection = await dbService.getCollection('users')
    try {
        const user = await collection.findOne({ "_id": ObjectId(userId) })
        delete user.password

        // user.givenReviews = await reviewService.query({ byUserId: ObjectId(user._id) })
        // user.givenReviews = user.givenReviews.map(review => {
        //     delete review.byUser
        //     return review
        // })


        return user
    } catch (err) {
        console.log(`ERROR: while finding user ${userId}`)
        throw err;
    }
}
async function getByUserName(userName) {
    const collection = await dbService.getCollection('users')
    console.log('collection:::', collection);
    try {
        const user = await collection.findOne({ userName: userName })
        console.log('user::', user);

        return user
    } catch (err) {
        console.log(`ERROR: while finding user ${userName}`)
        throw err;
    }
}

async function remove(userId) {
    const collection = await dbService.getCollection('users')
    try {
        await collection.deleteOne({ "_id": ObjectId(userId) })
    } catch (err) {
        console.log(`ERROR: cannot remove user ${userId}`)
        throw err;
    }
}

async function update(user) {
    const collection = await dbService.getCollection('users')
    user._id = ObjectId(user._id);

    try {
        await collection.replaceOne({ "_id": user._id }, { $set: user })
        return user
    } catch (err) {
        console.log(`ERROR: cannot update user ${user._id}`)
        throw err;
    }
}

async function add(user) {
    const collection = await dbService.getCollection('users')
    try {
        await collection.insertOne(user);
        return user;
    } catch (err) {
        console.log(`ERROR: cannot insert user`)
        throw err;
    }
}

function _buildCriteria(filterBy) {
    const criteria = {};
    if (filterBy.txt) {
        criteria.username = { '$regex': `.*${filterBy.username}.*/i` }
    }
    if (filterBy.minBalance) {
        criteria.balance = { $gte: +filterBy.minBalance }
    }
    return criteria;
}
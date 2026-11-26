import { describe, test } from "node:test"
import assert from "node:assert/strict"

import {
    getAllUsers,
    getUserById,
} from '../src/services/users.js'

describe('User Service Tests', () => {
    test('getAllUsers should return an array of users', () => {
        const users = getAllUsers()
        assert.equal(users.length, 2)
        assert.ok(users.some(user => user.name === 'Alice'))
    })

    test('Should find user by ID', () => {
        const users = getAllUsers()
        const user = getUserById(users[0].id)
        assert.deepStrictEqual(user, users[0])
    })

    test('Should return undefined for non-existing user ID', () => {
        const user = getUserById('non-existing-id')
        assert.equal(user, undefined)
    })  
})
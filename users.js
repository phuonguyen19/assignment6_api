import express from 'express'
// requires npm install uuid
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

// simulate the database

let users = [
    {id: uuidv4(), name: 'Alice'},
    {id: uuidv4(), name: 'Bob'}
]

router.get('/', (req, res) => {
    res.json( users )
})

router.get('/:id', ( req, res ) => {
    const id = req.params.id
    const user = users.find( anItem => anItem.id === id )
    if ( !user )
        return res.status(404).json({error: "User not found"})
    else
        return res.json( user )
})

export default router
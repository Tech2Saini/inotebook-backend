// const express = require('express');
// const Notes = require('../models/Notes');
// const path = require('path');
// const router = express.Router();
// const { body, validationResult } = require('express-validator') // TO validate the form fields 
// const getUserDetails = require("../middleware/getUserDetails")
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// // ROUTE 1: Fetching all notes of a specific user using auth token
// router.get("/getnotes", getUserDetails, async (req, res) => {
//     // try to fetch all notes for authenticated user
//     try {
//         let notes = await Notes.find({ user: req.user.id }).sort({"date":-1});
//         res.status(200).send(notes)
//     } catch (error) {
//         res.status(401).json({ "error": "Invalid user auth token" })
//     }
// })

// // ROUTE 2: Add new note for a specific user using auth token and json note data.
// router.post("/addnotes", getUserDetails,
//     // checks validations for note fields
//     [
//         body('title', "title should be longer than 15 chars..").isLength({ min: 5 }),
//         body('description', "description should be longer than 20 chars..").isLength({ min: 10 }),
//     ],
//     async (req, res) => {
//         let { title, description, tag,status} = req.body;
//         // let status = req.body.status?req.body.status:"panding"
//         // Returns error if occured due to invalid inputs for note 
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({ errors: errors.array() })
//         }

//         // Finally save the note if all things are correct
//         try {
//             let notes = new Notes({ title, description, tag,status, user: req.user.id });
//             let savedNote = await notes.save()
//             res.status(200).json(savedNote)
//         } catch (error) {
//             res.status(401).json({ "error": "Invalid user auth token" })
//         }
//     })

// // ROUTE 3: Udpate the existing note for a specific user using note id note data.
// router.put("/updatenotes/:id", getUserDetails,
//     [
//         body('title', "title should be longer than 15 chars..").isLength({ min: 5 }),
//         body('description', "description should be longer than 20 chars..").isLength({ min: 10 }),
//     ],
//     async (req, res) => {
//         // Returns error if occured due to invalid inputs for note
//         let { title, description, tag } = req.body;
//         console.log("data reach on server : ", title, description, tag);

//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             console.log("Empty")
//             return res.status(400).json({ errors: errors.array() })
//         }

//         try {

//             // Create newNote object and add udpated data
//             let newNote = {};
//             if (title) { newNote.title = title }
//             if (description) { newNote.description = description }
//             if (tag) { newNote.tag = tag }

//             // Find the note to be update and update it.
//             let note = await Notes.findById(req.params.id);
//             if (!note) {
//                 console.log("no note found")
//                 return res.status(404).json({ "message": "Note is not found !" })
//             }

//             if (note.user.toString() !== req.user.id) { console.log("not allowed"); return res.status(401).json({ "message": "Not allowed for update" }) }

//             note = await Notes.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true })

//             res.status(200).json(note)
//         }
//         catch (error) {
//             console.log("some error is occured")
//             res.status(400).json({
//                 "status": 400,
//                 "message": "Some error is occured during update !"
//             })
//         }
//     })

// // ROUTE 3: Udpate the existing note for a specific user using note id note data.
// router.delete("/deletenotes/:id", getUserDetails,
//     async (req, res) => {


//         try {

//             // Find the note to be update and update it.
//             let note = await Notes.findById(req.params.id);
//             if (!note) {
//                 return res.status(404).json({ "status": false, message: "Note is not found !" })
//             }

//             if (note.user.toString() !== req.user.id) { return res.status(401).json({ "status": true, "message": "Not allowed for delete" }) }

//             note = await Notes.findByIdAndDelete(req.params.id)

//             // res.status(200).json({"message":"update successfully"})
//             res.status(200).json(note)

//         }
//         catch (error) {
//             res.status(400).json({
//                 "status": 400,
//                 "message": "Some error is occured during update !"
//             })
//         }
//     }
// )

// // ROUTE 4: Change the status of a note panding to complete
// router.post("/changestatus/:id", getUserDetails,
//     async (req, res) => {
//         try {
//             // Find the note to be update and update it.
//             let note = await Notes.findById(req.params.id);
//             if (!note) {
//                 return res.status(404).json({ "status": false, message: "Note is not found !" })
//             }

//             if (note.user.toString() !== req.user.id) { return res.status(401).json({ "status": true, "message": "You not allowed for updates" }) }

//             note = await Notes.findByIdAndUpdate(req.params.id, { $set: { status: "complete" } }, { new: true })

//             // res.status(200).json({"message":"update successfully"})
//             res.status(200).json({ "note": note, "status": 500, "message": "Note marked as complete" })

//         }
//         catch (error) {
//             res.status(400).json({
//                 "status": 400,
//                 "message": "Some error is occured during update !",
//                 "error": error
//             })
//         }
//     }
// )
// module.exports = router;







// routes/notes.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require("./firebase");
const getUserDetails = require("../middleware/getUserDetails");

// ROUTE 1: Fetch all notes for a user
router.get("/getnotes", getUserDetails, async (req, res) => {
    try {
        const snapshot = await db.ref(`notes/${req.user.id}`).once('value');
        const notes = [];
        snapshot.forEach(childSnap => {
            notes.push({ id: childSnap.key, ...childSnap.val() });
        });
        // Sort by date descending
        notes.sort((a, b) => new Date(b.date) - new Date(a.date));
        res.status(200).json(notes);
    } catch (err) {
        res.status(400).json({ error: "Error fetching notes", detail: err.message });
    }
});

// ROUTE 2: Add a new note
router.post("/addnotes", getUserDetails, [
    body('title').isLength({ min: 5 }).withMessage("Title must be at least 5 chars"),
    body('description').isLength({ min: 10 }).withMessage("Description must be at least 10 chars")
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, tag, status } = req.body;

    const noteData = {
        title,
        description,
        tag: tag || 'general',
        status: status || 'panding',
        date: new Date().toISOString(),
        user: req.user.id
    };

    const newNoteRef = db.ref(`notes/${req.user.id}`).push();
    noteData['_id'] = newNoteRef.key
    await newNoteRef.set(noteData);

    res.status(200).json({ _id: newNoteRef.key, ...noteData });
});

// ROUTE 3: Update a note
router.put("/updatenotes/:id", getUserDetails, [
    body('title').isLength({ min: 5 }).withMessage("Title must be at least 5 chars"),
    body('description').isLength({ min: 10 }).withMessage("Description must be at least 10 chars")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, tag } = req.body;
    const noteRef = db.ref(`notes/${req.user.id}/${req.params.id}`);
    const snapshot = await noteRef.once('value');

    if (!snapshot.exists()) return res.status(404).json({ message: "Note not found" });

    const note = snapshot.val();
    if (note.user !== req.user.id) return res.status(401).json({ message: "Not allowed" });

    const updatedData = {};
    if (title) updatedData.title = title;
    if (description) updatedData.description = description;
    if (tag) updatedData.tag = tag;

    await noteRef.update(updatedData);

    const updatedSnap = await noteRef.once('value');
    res.status(200).json({ id: req.params.id, ...updatedSnap.val() });
});

// ROUTE 4: Delete a note
router.delete("/deletenotes/:id", getUserDetails, async (req, res) => {
    const noteRef = db.ref(`notes/${req.user.id}/${req.params.id}`);
    const snapshot = await noteRef.once('value');

    if (!snapshot.exists()) return res.status(404).json({ message: "Note not found" });

    const note = snapshot.val();
    if (note.user !== req.user.id) return res.status(401).json({ message: "Not allowed" });

    await noteRef.remove();
    res.status(200).json({ status: true, message: "Note deleted successfully" });
});

// ROUTE 5: Change note status
router.post("/changestatus/:id", getUserDetails, async (req, res) => {
    const noteRef = db.ref(`notes/${req.user.id}/${req.params.id}`);
    const snapshot = await noteRef.once('value');

    if (!snapshot.exists()) return res.status(404).json({ message: "Note not found" });

    const note = snapshot.val();
    if (note.user !== req.user.id) return res.status(401).json({ message: "Not allowed" });

    await noteRef.update({ status: "complete" });

    const updatedSnap = await noteRef.once('value');
    res.status(200).json({ note: updatedSnap.val(), message: "Note marked as complete" });
});

module.exports = router;

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
const {db, auth} = require("../firebase");
const getUserDetails = require("../middleware/getUserDetails");

// ROUTE 1: Fetch all notes for a user
router.get("/getnotes", getUserDetails, async (req, res) => {
    console.log("The status code is : ",res.statusCode)
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
        favorite:false,
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

    const { title, description, tag,status,favorite} = req.body;
    const noteRef = db.ref(`notes/${req.user.id}/${req.params.id}`);
    const snapshot = await noteRef.once('value');

    if (!snapshot.exists()) return res.status(404).json({ message: "Note not found" });

    const note = snapshot.val();
    if (note.user !== req.user.id) return res.status(401).json({ message: "Not allowed" });

    const updatedData = {};
    if (title) updatedData.title = title;
    if (description) updatedData.description = description;
    if (tag) updatedData.tag = tag;
    if (status) updatedData.status = status;
    if (favorite) updatedData.favorite = favorite;

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

// ====================== NOTE SHARING ======================
// Shares are stored at  shares/{noteId}  and reference the live note.
// visibility: "public"  -> anyone with the link can read
// visibility: "private" -> only logged-in users whose email is in `emails`

// ROUTE 6: Get the current share config for a note (owner only)
router.get("/share/:id", getUserDetails, async (req, res) => {
    try {
        const shareSnap = await db.ref(`shares/${req.params.id}`).once('value');
        if (!shareSnap.exists()) return res.status(200).json({ shared: false });
        const share = shareSnap.val();
        if (share.ownerUid !== req.user.id) return res.status(401).json({ message: "Not allowed" });
        res.status(200).json({ shared: true, ...share });
    } catch (err) {
        res.status(400).json({ error: "Error reading share", detail: err.message });
    }
});

// ROUTE 7: Create / update a share for a note (owner only)
router.post("/share/:id", getUserDetails, async (req, res) => {
    try {
        const noteRef = db.ref(`notes/${req.user.id}/${req.params.id}`);
        const noteSnap = await noteRef.once('value');
        if (!noteSnap.exists()) return res.status(404).json({ message: "Note not found" });

        const visibility = req.body.visibility === "private" ? "private" : "public";
        const emails = Array.isArray(req.body.emails)
            ? req.body.emails.map(e => String(e).trim().toLowerCase()).filter(Boolean)
            : [];

        const shareData = {
            ownerUid: req.user.id,
            noteId: req.params.id,
            visibility,
            emails,
            createdAt: new Date().toISOString()
        };

        await db.ref(`shares/${req.params.id}`).set(shareData);
        res.status(200).json({ shared: true, shareId: req.params.id, ...shareData });
    } catch (err) {
        res.status(400).json({ error: "Error creating share", detail: err.message });
    }
});

// ROUTE 8: Stop sharing a note (owner only)
router.delete("/share/:id", getUserDetails, async (req, res) => {
    try {
        const shareRef = db.ref(`shares/${req.params.id}`);
        const shareSnap = await shareRef.once('value');
        if (shareSnap.exists() && shareSnap.val().ownerUid !== req.user.id) {
            return res.status(401).json({ message: "Not allowed" });
        }
        await shareRef.remove();
        res.status(200).json({ shared: false, message: "Sharing stopped" });
    } catch (err) {
        res.status(400).json({ error: "Error removing share", detail: err.message });
    }
});

// ROUTE 9: Public read of a shared note (NO auth required).
// For private shares, an optional auth-token identifies the viewer's email.
router.get("/shared/:shareId", async (req, res) => {
    try {
        const shareSnap = await db.ref(`shares/${req.params.shareId}`).once('value');
        if (!shareSnap.exists()) return res.status(404).json({ message: "This shared note does not exist or was unshared." });
        const share = shareSnap.val();

        if (share.visibility === "private") {
            const token = req.header('auth-token');
            let viewerEmail = null;
            if (token) {
                try { viewerEmail = (await auth.verifyIdToken(token)).email?.toLowerCase() || null; } catch (e) { viewerEmail = null; }
            }
            if (!viewerEmail) {
                return res.status(401).json({ message: "This note is private. Please log in with an invited email to view it.", requiresLogin: true });
            }
            if (!(share.emails || []).includes(viewerEmail)) {
                return res.status(403).json({ message: "You don't have access to this note." });
            }
        }

        const noteSnap = await db.ref(`notes/${share.ownerUid}/${share.noteId}`).once('value');
        if (!noteSnap.exists()) return res.status(404).json({ message: "The original note was deleted." });

        const note = noteSnap.val();
        // Only expose the readable fields
        res.status(200).json({
            title: note.title,
            description: note.description,
            tag: note.tag,
            status: note.status,
            date: note.date,
            visibility: share.visibility
        });
    } catch (err) {
        res.status(400).json({ error: "Error reading shared note", detail: err.message });
    }
});

// ROUTE 10: Get all notes shared BY the current user
router.get("/shared-by-me", getUserDetails, async (req, res) => {
    try {
        console.log("[shared-by-me] user:", req.user.id);
        const sharesSnap = await db.ref('shares').once('value');
        console.log("[shared-by-me] shares exists:", sharesSnap.exists(), "| val:", JSON.stringify(sharesSnap.val()));
        if (!sharesSnap.exists()) return res.status(200).json([]);

        const result = [];
        const promises = [];
        sharesSnap.forEach(snap => {
            const share = snap.val();
            if (!share || !share.ownerUid || !share.noteId) return;
            if (share.ownerUid === req.user.id) {
                promises.push(
                    db.ref(`notes/${share.ownerUid}/${share.noteId}`).once('value').then(noteSnap => {
                        console.log("[shared-by-me] note lookup", share.noteId, "exists:", noteSnap.exists());
                        if (noteSnap.exists()) {
                            const note = noteSnap.val();
                            const emails = share.emails
                                ? (Array.isArray(share.emails) ? share.emails : Object.values(share.emails))
                                : [];
                            result.push({
                                shareId: snap.key,
                                noteId: share.noteId,
                                visibility: share.visibility,
                                emails,
                                createdAt: share.createdAt,
                                title: note.title,
                                tag: note.tag,
                            });
                        }
                    })
                );
            }
        });
        await Promise.all(promises);
        console.log("[shared-by-me] result count:", result.length);
        res.status(200).json(result);
    } catch (err) {
        console.error("[shared-by-me] error:", err.message);
        res.status(400).json({ error: "Error fetching shared-by-me notes", detail: err.message });
    }
});

// ROUTE 11: Get all notes shared WITH the current user (by email allow-list)
router.get("/shared-with-me", getUserDetails, async (req, res) => {
    try {
        const userEmail = req.user.email;
        console.log("[shared-with-me] user:", req.user.id, "email:", userEmail);
        if (!userEmail) return res.status(200).json([]);

        const sharesSnap = await db.ref('shares').once('value');
        if (!sharesSnap.exists()) return res.status(200).json([]);

        const result = [];
        const promises = [];
        sharesSnap.forEach(snap => {
            const share = snap.val();
            if (!share || !share.ownerUid || !share.noteId) return;

            // Normalise emails — Firebase may store array as {0:"...", 1:"..."} object
            const emails = share.emails
                ? (Array.isArray(share.emails) ? share.emails : Object.values(share.emails))
                : [];

            if (
                share.visibility === 'private' &&
                emails.includes(userEmail) &&
                share.ownerUid !== req.user.id
            ) {
                console.log("[shared-with-me] match found:", snap.key);
                promises.push(
                    db.ref(`notes/${share.ownerUid}/${share.noteId}`).once('value').then(noteSnap => {
                        if (noteSnap.exists()) {
                            const note = noteSnap.val();
                            result.push({
                                shareId: snap.key,
                                noteId: share.noteId,
                                ownerUid: share.ownerUid,
                                createdAt: share.createdAt,
                                title: note.title,
                                tag: note.tag,
                            });
                        }
                    })
                );
            }
        });
        await Promise.all(promises);
        console.log("[shared-with-me] result count:", result.length);
        res.status(200).json(result);
    } catch (err) {
        console.error("[shared-with-me] error:", err.message);
        res.status(400).json({ error: "Error fetching shared-with-me notes", detail: err.message });
    }
});

module.exports = router;

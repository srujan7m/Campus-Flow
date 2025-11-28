const express = require('express');
const { admin } = require('../config/firebase');
const { COLLECTIONS, TICKET_STATUS } = require('../config/firestore-schema');
const { sendOrganizerReply } = require('../services/telegram');

const router = express.Router();

/**
 * Helper to resolve eventCode to eventId
 */
async function resolveEventId(eventCodeOrId) {
    const db = admin.firestore();
    
    // First try direct doc lookup
    const eventDoc = await db.collection(COLLECTIONS.EVENTS).doc(eventCodeOrId).get();
    if (eventDoc.exists) {
        return eventCodeOrId;
    }
    
    // Try finding by eventCode
    const snapshot = await db.collection(COLLECTIONS.EVENTS)
        .where('eventCode', '==', eventCodeOrId.toUpperCase())
        .limit(1)
        .get();
    
    if (!snapshot.empty) {
        return snapshot.docs[0].id;
    }
    
    return null;
}

/**
 * GET /api/tickets/:eventCode - List tickets for an event by eventCode or eventId
 */
router.get('/:eventCode', async (req, res) => {
    try {
        const db = admin.firestore();
        const { status } = req.query;

        // Resolve eventCode to eventId
        const eventId = await resolveEventId(req.params.eventCode);
        if (!eventId) {
            return res.status(404).json({ error: 'Event not found' });
        }

        let query = db.collection(COLLECTIONS.TICKETS).where('eventId', '==', eventId);

        if (status) {
            query = query.where('status', '==', status);
        }

        const snapshot = await query.orderBy('createdAt', 'desc').get();

        const tickets = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            tickets.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || null,
                answeredAt: data.answeredAt?.toDate?.() || null
            });
        });

        res.json({ tickets });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

/**
 * GET /api/tickets - List all tickets (with optional filters)
 */
router.get('/', async (req, res) => {
    try {
        const db = admin.firestore();
        const { eventId, status } = req.query;

        let query = db.collection(COLLECTIONS.TICKETS);

        if (eventId) {
            query = query.where('eventId', '==', eventId);
        }
        if (status) {
            query = query.where('status', '==', status);
        }

        const snapshot = await query.orderBy('createdAt', 'desc').get();

        const tickets = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            tickets.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || null,
                answeredAt: data.answeredAt?.toDate?.() || null
            });
        });

        res.json({ tickets });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

/**
 * POST /api/tickets/:id/reply - Reply to ticket
 */
router.post('/:id/reply', async (req, res) => {
    try {
        // Support both 'replyText' and 'answer' for backwards compatibility
        const replyText = req.body.replyText || req.body.answer;
        
        if (!replyText) {
            return res.status(400).json({ error: 'Reply text is required' });
        }

        await sendOrganizerReply(req.params.id, replyText);

        res.json({ success: true });
    } catch (error) {
        console.error('Error replying to ticket:', error);
        res.status(500).json({ error: 'Failed to send reply' });
    }
});

/**
 * PUT /api/tickets/:id/status - Update ticket status
 */
router.put('/:id/status', async (req, res) => {
    try {
        const db = admin.firestore();
        const { status } = req.body;

        await db.collection(COLLECTIONS.TICKETS).doc(req.params.id).update({
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating ticket status:', error);
        res.status(500).json({ error: 'Failed to update ticket status' });
    }
});

module.exports = router;

import { NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebaseAdmin';
import { getPreviousWeekID } from '@/lib/utils';
// FIX: Import FieldValue directly from the admin package
import { FieldValue, type QueryDocumentSnapshot } from 'firebase-admin/firestore'; 

// FIXED POOL
const WEEKLY_POOL_SRP = 50000;

export async function POST(request: Request) {
  try {
    const { fid } = await request.json();
    if (!fid) return NextResponse.json({ error: 'Missing FID' }, { status: 400 });

    const prevWeekID = getPreviousWeekID();
    
    // Initialize Admin SDK
    const adminApp = initAdmin(); // Renamed to adminApp to avoid confusion
    const db = adminApp.firestore(); // .firestore() works on the app instance to get the DB

    // 1. Check if user already claimed
    const userRef = db.collection('users').doc(fid.toString());
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const userData = userSnap.data();

    if (userData?.claimedWeeks?.includes(prevWeekID)) {
      return NextResponse.json({ error: 'Already claimed for this week' }, { status: 400 });
    }

    // 2. RECONSTRUCT LEADERBOARD (PREVIOUS WEEK)
    const usersRef = db.collection('users');
    
    const queryA = usersRef.where('lastActiveWeek', '==', prevWeekID);
    const queryB = usersRef.where('previousActiveWeek', '==', prevWeekID);

    const [snapshotA, snapshotB] = await Promise.all([queryA.get(), queryB.get()]);

    const allEntries: { fid: number, score: number }[] = [];

    snapshotA.forEach((doc: QueryDocumentSnapshot) => {
        const d = doc.data();
        allEntries.push({ fid: d.fid, score: d.weeklyScore || 0 });
    });

    snapshotB.forEach((doc: QueryDocumentSnapshot) => {
        const d = doc.data();
        allEntries.push({ fid: d.fid, score: d.previousWeeklyScore || 0 });
    });

    // Sort to determine rank
    allEntries.sort((a, b) => b.score - a.score);

    // 3. Determine Top 100 and Total Score
    const top100 = allEntries.slice(0, 100);
    const totalTop100Score = top100.reduce((acc, curr) => acc + curr.score, 0);

    // Find User Rank
    const rankIndex = allEntries.findIndex(u => u.fid === fid);
    const userEntry = allEntries[rankIndex];
    
    // Check eligibility (Top 100)
    if (rankIndex === -1 || rankIndex > 99) {
        return NextResponse.json({ 
            error: 'Not in Top 100 for last week.', 
            debug: { yourRank: rankIndex + 1 } 
        }, { status: 400 });
    }

    // 4. Calculate SRP Reward
    let rewardAmount = 0;
    if (totalTop100Score > 0) {
        rewardAmount = (userEntry.score / totalTop100Score) * WEEKLY_POOL_SRP;
    }

    // Round to 2 decimal places
    rewardAmount = Math.floor(rewardAmount * 100) / 100;

    if (rewardAmount <= 0) return NextResponse.json({ error: 'No reward calculation error.' }, { status: 400 });

    // 5. Update Firebase
    // FIX: Use the imported FieldValue class directly
    await userRef.update({
        claimedWeeks: FieldValue.arrayUnion(prevWeekID),
        earnedSRP: FieldValue.increment(rewardAmount)
    });

    return NextResponse.json({ success: true, amount: rewardAmount, currency: 'SRP' });

  } catch (error) {
    console.error("Claim Error Details:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
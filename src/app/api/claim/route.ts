import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { getPreviousWeekID } from '@/lib/utils';
import { createWalletClient, http, parseUnits, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

// USDC Contract on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// Reward Percentages
const REWARDS = [0.35, 0.25, 0.20, 0.12, 0.08];

export async function POST(request: Request) {
  try {
    const { fid } = await request.json();
    if (!fid) return NextResponse.json({ error: 'Missing FID' }, { status: 400 });

    const prevWeekID = getPreviousWeekID();
    
    // 1. Check if user already claimed
    const userRef = doc(db, 'users', fid.toString());
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const userData = userSnap.data();

    if (userData.claimedWeeks?.includes(prevWeekID)) {
      return NextResponse.json({ error: 'Already claimed for this week' }, { status: 400 });
    }

    if (!userData.walletAddress) {
        return NextResponse.json({ error: 'No wallet linked. Please connect wallet on Home.' }, { status: 400 });
    }

    // 2. Fetch Leaderboard for Previous Week
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('lastActiveWeek', '==', prevWeekID));
    const querySnapshot = await getDocs(q);

    const allEntries: { fid: number, score: number }[] = [];
    querySnapshot.forEach((doc) => {
        const d = doc.data();
        allEntries.push({ fid: d.fid, score: d.weeklyScore || 0 });
    });

    // Sort to determine rank
    allEntries.sort((a, b) => b.score - a.score);

    // Find User Rank
    const rankIndex = allEntries.findIndex(u => u.fid === fid);
    if (rankIndex === -1 || rankIndex > 4) {
        return NextResponse.json({ error: 'Not in Top 5 for last week.' }, { status: 400 });
    }

    // 3. Calculate Reward
    const campaignRef = doc(db, 'campaigns', prevWeekID);
    const campaignSnap = await getDoc(campaignRef);
    const poolTotal = campaignSnap.exists() ? (campaignSnap.data().poolTotal || 0) : 0;
    
    const rewardAmount = poolTotal * REWARDS[rankIndex];
    if (rewardAmount <= 0) return NextResponse.json({ error: 'No reward pool available.' }, { status: 400 });

    // 4. Send USDC (Server-Side Secure Transaction)
    if (!process.env.DEV_WALLET_PRIVATE_KEY) {
        return NextResponse.json({ error: 'Server config error (Missing Key)' }, { status: 500 });
    }

    const account = privateKeyToAccount(`0x${process.env.DEV_WALLET_PRIVATE_KEY}`);
    const client = createWalletClient({
      account,
      chain: base,
      transport: http()
    }).extend(publicActions);

    const hash = await client.writeContract({
      address: USDC_ADDRESS,
      abi: [{
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }],
        outputs: [{ name: '', type: 'bool' }]
      }],
      functionName: 'transfer',
      args: [userData.walletAddress, parseUnits(rewardAmount.toString(), 6)]
    });

    // 5. Update Firebase
    await updateDoc(userRef, {
        claimedWeeks: arrayUnion(prevWeekID),
        totalEarnings: increment(rewardAmount)
    });

    return NextResponse.json({ success: true, txHash: hash, amount: rewardAmount });

  } catch (error) {
    console.error("Claim Error:", error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
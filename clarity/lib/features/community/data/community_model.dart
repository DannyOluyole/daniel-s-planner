import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_theme.dart';

class Post {
  Post({
    required this.id,
    required this.initials,
    required this.avatarColor,
    required this.name,
    required this.badgeLabel,
    required this.badgeColor,
    required this.timeAgo,
    required this.body,
    required this.likes,
    required this.replies,
    required this.liked,
  });

  final String id;
  final String initials;
  final Color  avatarColor;
  final String name;
  final String badgeLabel;
  final Color  badgeColor;
  final String timeAgo;
  final String body;
  final int    replies;
  int          likes;
  bool         liked;
}

class Milestone {
  const Milestone({
    required this.emoji,
    required this.name,
    required this.days,
    required this.note,
  });
  final String emoji;
  final String name;
  final int    days;
  final String note;
}

class SupportPeer {
  const SupportPeer({
    required this.initials,
    required this.avatarColor,
    required this.initColor,
    required this.name,
    required this.streak,
    required this.bio,
  });
  final String initials;
  final Color  avatarColor;
  final Color  initColor;
  final String name;
  final int    streak;
  final String bio;
}

class CommunityState {
  CommunityState({
    required this.posts,
    required this.milestones,
    required this.peers,
    required this.mood,
  });

  final List<Post>       posts;
  final List<Milestone>  milestones;
  final List<SupportPeer> peers;
  final int              mood; // -1 = none selected
}

class CommunityNotifier extends StateNotifier<CommunityState> {
  CommunityNotifier()
      : super(CommunityState(
          mood: -1,
          posts: [
            Post(
              id: '1',
              initials: 'MK',
              avatarColor: ct.purpleDeep,
              name: 'Marcus K.',
              badgeLabel: '🔥 21 days',
              badgeColor: ct.teal,
              timeAgo: '2 hours ago',
              body:
                  "Had a really hard evening. Opened TikTok three times out of habit — Productivity Max blocked it each time. But I didn't give in. That counts.",
              likes: 24,
              replies: 8,
              liked: true,
            ),
            Post(
              id: '2',
              initials: '',
              avatarColor: ct.bgElevated,
              name: 'Anonymous',
              badgeLabel: 'private',
              badgeColor: ct.border,
              timeAgo: '5 hours ago',
              body:
                  'Does anyone else feel like the first week is the absolute hardest? Day 4 and I keep finding reasons to open Reddit.',
              likes: 11,
              replies: 14,
              liked: false,
            ),
          ],
          milestones: const [
            Milestone(emoji: '🏆', name: 'Jordan', days: 30, note: 'No social media'),
            Milestone(emoji: '⚡', name: 'Priya',  days: 14, note: 'Screen time under 1hr'),
            Milestone(emoji: '🌱', name: 'Alex',   days: 7,  note: 'Porn-free first week'),
            Milestone(emoji: '💎', name: 'Sam',    days: 60, note: 'No doomscrolling'),
          ],
          peers: const [
            SupportPeer(
              initials: 'JL',
              avatarColor: ct.tealTint,
              initColor: ct.tealLight,
              name: 'Jamie L.',
              streak: 14,
              bio: 'Been through doomscrolling addiction. Happy to listen or just keep you company.',
            ),
            SupportPeer(
              initials: 'TD',
              avatarColor: Color(0xFF1A1520),
              initColor: ct.purplePale,
              name: 'Taylor D.',
              streak: 30,
              bio: '30 days in. The first week was the hardest for me too. DM me anytime.',
            ),
          ],
        ));

  void setMood(int mood) => state = CommunityState(
        posts: state.posts,
        milestones: state.milestones,
        peers: state.peers,
        mood: mood,
      );

  void toggleLike(String postId) {
    for (final p in state.posts) {
      if (p.id == postId) {
        p.liked = !p.liked;
        p.likes += p.liked ? 1 : -1;
      }
    }
    state = CommunityState(
      posts: List.from(state.posts),
      milestones: state.milestones,
      peers: state.peers,
      mood: state.mood,
    );
  }
}

final communityProvider =
    StateNotifierProvider<CommunityNotifier, CommunityState>(
        (_) => CommunityNotifier());

// lib/features/community/presentation/screens/community_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tabler_icons/flutter_tabler_icons.dart';

import '../../../../core/theme/app_theme.dart';
import '../../data/community_model.dart';

class CommunityScreen extends ConsumerStatefulWidget {
  const CommunityScreen({super.key});

  @override
  ConsumerState<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends ConsumerState<CommunityScreen> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final community = ref.watch(communityProvider);
    final notifier  = ref.read(communityProvider.notifier);

    return Scaffold(
      backgroundColor: ClarityColors.bgSurface,
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ──
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
              child: Row(
                children: const [
                  Expanded(
                    child: Text('Community',
                        style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w500,
                            color: ClarityColors.textPrimary)),
                  ),
                  Icon(TablerIcons.bell,
                      size: 22, color: ClarityColors.textDisabled),
                ],
              ),
            ),

            // ── Segment ──
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _SegmentControl(
                labels: const ['Feed', 'Support', 'Wins'],
                current: _tab,
                onChanged: (i) => setState(() => _tab = i),
              ),
            ),
            const SizedBox(height: 12),

            // ── Body ──
            Expanded(
              child: _tab == 0
                  ? _FeedTab(
                      mood: community.mood,
                      posts: community.posts,
                      onMoodSelect: notifier.setMood,
                      onToggleLike: notifier.toggleLike,
                    )
                  : _tab == 1
                      ? _SupportTab(peers: community.peers)
                      : _WinsTab(milestones: community.milestones),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Feed tab ────────────────────────────────────────────────────────────────

class _FeedTab extends StatelessWidget {
  const _FeedTab({
    required this.mood,
    required this.posts,
    required this.onMoodSelect,
    required this.onToggleLike,
  });
  final int              mood;
  final List<Post>       posts;
  final ValueChanged<int> onMoodSelect;
  final ValueChanged<String> onToggleLike;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        _CheckInCard(mood: mood, onMoodSelect: onMoodSelect),
        const SizedBox(height: 10),
        _SOSBanner(),
        const SizedBox(height: 10),
        const _MilestoneCard(
          emoji: '🏆',
          name: 'Jordan',
          days: 30,
          note: 'No social media for a whole month',
        ),
        const SizedBox(height: 10),
        ...posts.expand((p) => [
              _PostCard(post: p, onToggleLike: onToggleLike),
              const SizedBox(height: 10),
            ]),
        const SizedBox(height: 10),
      ],
    );
  }
}

class _CheckInCard extends StatelessWidget {
  const _CheckInCard({required this.mood, required this.onMoodSelect});
  final int             mood;
  final ValueChanged<int> onMoodSelect;

  static const _moods = ['😔', '😐', '🙂', '😊', '🤩'];
  static const _labels = ['Rough', 'Meh', 'OK', 'Good', 'Great'];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ClarityColors.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ClarityColors.border, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('HOW ARE YOU FEELING?',
              style: TextStyle(
                  fontSize: 11,
                  color: ClarityColors.textDisabled,
                  letterSpacing: 0.8)),
          const SizedBox(height: 10),
          Row(
            children: List.generate(_moods.length, (i) {
              final sel = i == mood;
              return Expanded(
                child: GestureDetector(
                  onTap: () => onMoodSelect(i),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: EdgeInsets.only(left: i == 0 ? 0 : 4),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: sel
                          ? ClarityColors.purpleTint
                          : ClarityColors.bgInput,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: sel
                            ? ClarityColors.purple
                            : ClarityColors.border,
                        width: 0.5,
                      ),
                    ),
                    child: Column(
                      children: [
                        Text(_moods[i],
                            style: const TextStyle(fontSize: 18)),
                        const SizedBox(height: 3),
                        Text(_labels[i],
                            style: const TextStyle(
                                fontSize: 9,
                                color: ClarityColors.textDisabled)),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

class _SOSBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1A0A0A),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ClarityColors.redDark, width: 0.5),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: ClarityColors.redDark.withAlpha(34),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(TablerIcons.alert_triangle,
                size: 18, color: ClarityColors.red),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Struggling right now?',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: ClarityColors.redLight)),
                const SizedBox(height: 4),
                const Text(
                    'Tap SOS to be matched with someone available to talk.',
                    style: TextStyle(
                        fontSize: 12,
                        color: ClarityColors.textFaint,
                        height: 1.5)),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: () {},
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 7),
                    decoration: BoxDecoration(
                      color: ClarityColors.redDark,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text('Send SOS',
                        style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFFFCEBEB))),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MilestoneCard extends StatelessWidget {
  const _MilestoneCard(
      {required this.emoji,
      required this.name,
      required this.days,
      required this.note});
  final String emoji;
  final String name;
  final int    days;
  final String note;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ClarityColors.tealTint,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ClarityColors.tealDark, width: 0.5),
      ),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 28)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('$name hit $days days clean',
                    style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: ClarityColors.tealLight)),
                const SizedBox(height: 2),
                Text(note,
                    style: const TextStyle(
                        fontSize: 12, color: ClarityColors.textDisabled)),
              ],
            ),
          ),
          GestureDetector(
            onTap: () {},
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                color: ClarityColors.tealDark.withAlpha(34),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('🎉 Cheer',
                  style:
                      TextStyle(fontSize: 12, color: ClarityColors.teal)),
            ),
          ),
        ],
      ),
    );
  }
}

class _PostCard extends StatelessWidget {
  const _PostCard({required this.post, required this.onToggleLike});
  final Post post;
  final ValueChanged<String> onToggleLike;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ClarityColors.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ClarityColors.border, width: 0.5),
      ),
      child: Column(
        children: [
          Row(
            children: [
              _Avatar(initials: post.initials, bg: post.avatarColor),
              const SizedBox(width: 9),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(post.name,
                            style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: ClarityColors.textSecondary)),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: post.badgeColor.withAlpha(34),
                            borderRadius: BorderRadius.circular(5),
                          ),
                          child: Text(post.badgeLabel,
                              style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w500,
                                  color: post.badgeColor)),
                        ),
                      ],
                    ),
                    Text(post.timeAgo,
                        style: const TextStyle(
                            fontSize: 11, color: ClarityColors.textDisabled)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(post.body,
                style: const TextStyle(
                    fontSize: 13,
                    color: ClarityColors.textMuted,
                    height: 1.6)),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              GestureDetector(
                onTap: () => onToggleLike(post.id),
                child: Row(
                  children: [
                    Icon(TablerIcons.heart,
                        size: 16,
                        color: post.liked
                            ? ClarityColors.pink
                            : ClarityColors.textDisabled),
                    const SizedBox(width: 4),
                    Text('${post.likes}',
                        style: TextStyle(
                            fontSize: 12,
                            color: post.liked
                                ? ClarityColors.pink
                                : ClarityColors.textDisabled)),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              const Icon(TablerIcons.message_circle,
                  size: 16, color: ClarityColors.textDisabled),
              const SizedBox(width: 4),
              Text('${post.replies} replies',
                  style: const TextStyle(
                      fontSize: 12, color: ClarityColors.textDisabled)),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Support tab ─────────────────────────────────────────────────────────────

class _SupportTab extends StatelessWidget {
  const _SupportTab({required this.peers});
  final List<SupportPeer> peers;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        const Text('AVAILABLE TO TALK NOW',
            style: TextStyle(
                fontSize: 11,
                color: ClarityColors.textDisabled,
                letterSpacing: 0.8)),
        const SizedBox(height: 10),
        ...peers.expand((p) => [
              _SupportCard(peer: p),
              const SizedBox(height: 10),
            ]),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: ClarityColors.bgCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: ClarityColors.border, width: 0.5),
          ),
          child: Column(
            children: [
              const Text('Want to support others?',
                  style: TextStyle(
                      fontSize: 13, color: ClarityColors.textDisabled)),
              const SizedBox(height: 10),
              OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: ClarityColors.purple, width: 0.5),
                  foregroundColor: ClarityColors.purpleLight,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Become a listener'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }
}

class _SupportCard extends StatelessWidget {
  const _SupportCard({required this.peer});
  final SupportPeer peer;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ClarityColors.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ClarityColors.border, width: 0.5),
      ),
      child: Column(
        children: [
          Row(
            children: [
              _Avatar(initials: peer.initials, bg: peer.avatarColor, fg: peer.initColor),
              const SizedBox(width: 9),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(peer.name,
                        style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: ClarityColors.textSecondary)),
                    Text('● Online now · ${peer.streak} day streak',
                        style: const TextStyle(
                            fontSize: 11, color: ClarityColors.teal)),
                  ],
                ),
              ),
              GestureDetector(
                onTap: () {},
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: ClarityColors.purple,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text('Talk',
                      style: TextStyle(
                          fontSize: 12, color: ClarityColors.textPrimary)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(peer.bio,
                style: const TextStyle(
                    fontSize: 13,
                    color: ClarityColors.textMuted,
                    height: 1.5)),
          ),
        ],
      ),
    );
  }
}

// ─── Wins tab ────────────────────────────────────────────────────────────────

class _WinsTab extends StatelessWidget {
  const _WinsTab({required this.milestones});
  final List<Milestone> milestones;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        const Text('RECENT MILESTONES',
            style: TextStyle(
                fontSize: 11,
                color: ClarityColors.textDisabled,
                letterSpacing: 0.8)),
        const SizedBox(height: 10),
        ...milestones.map((m) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _MilestoneCard(
                emoji: m.emoji,
                name: m.name,
                days: m.days,
                note: m.note,
              ),
            )),
        const SizedBox(height: 10),
      ],
    );
  }
}

// ─── Shared ───────────────────────────────────────────────────────────────────

class _Avatar extends StatelessWidget {
  const _Avatar({
    required this.initials,
    required this.bg,
    this.fg = ClarityColors.purplePale,
  });
  final String initials;
  final Color  bg;
  final Color  fg;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
      child: initials.isEmpty
          ? const Icon(TablerIcons.user_off,
              size: 14, color: ClarityColors.textDisabled)
          : Center(
              child: Text(initials,
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: fg)),
            ),
    );
  }
}

class _SegmentControl extends StatelessWidget {
  const _SegmentControl(
      {required this.labels, required this.current, required this.onChanged});
  final List<String>      labels;
  final int               current;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: ClarityColors.bgCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ClarityColors.border, width: 0.5),
      ),
      child: Row(
        children: labels.asMap().entries.map((e) {
          final i   = e.key;
          final sel = i == current;
          return Expanded(
            child: GestureDetector(
              onTap: () => onChanged(i),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: sel ? ClarityColors.purple : Colors.transparent,
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Text(
                  e.value,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: sel
                        ? ClarityColors.textPrimary
                        : ClarityColors.textDisabled,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

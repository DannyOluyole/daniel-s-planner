// lib/features/community/presentation/screens/community_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_tabler_icons/flutter_tabler_icons.dart';

import '../../../../core/theme/app_theme.dart';

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  int _tab = 0;
  int _mood = -1;

  @override
  Widget build(BuildContext context) {
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
                  ? _FeedTab(mood: _mood, onMoodSelect: (m) => setState(() => _mood = m))
                  : _tab == 1
                      ? const _SupportTab()
                      : const _WinsTab(),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Feed tab ────────────────────────────────────────────────────────────────

class _FeedTab extends StatelessWidget {
  const _FeedTab({required this.mood, required this.onMoodSelect});
  final int             mood;
  final ValueChanged<int> onMoodSelect;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        _CheckInCard(mood: mood, onMoodSelect: onMoodSelect),
        const SizedBox(height: 10),
        _SOSBanner(),
        const SizedBox(height: 10),
        _MilestoneCard(
          emoji: '🏆',
          name: 'Jordan',
          days: 30,
          note: 'No social media for a whole month',
        ),
        const SizedBox(height: 10),
        _PostCard(
          initials: 'MK',
          avatarColor: ClarityColors.purpleDeep,
          name: 'Marcus K.',
          badgeLabel: '🔥 21 days',
          badgeColor: ClarityColors.teal,
          timeAgo: '2 hours ago',
          body:
              'Had a really hard evening. Opened TikTok three times out of habit — Clarity blocked it each time. But I didn\'t give in. That counts.',
          likes: 24,
          replies: 8,
          liked: true,
        ),
        const SizedBox(height: 10),
        _PostCard(
          initials: '',
          avatarColor: ClarityColors.bgElevated,
          name: 'Anonymous',
          badgeLabel: 'private',
          badgeColor: ClarityColors.border,
          timeAgo: '5 hours ago',
          body:
              'Does anyone else feel like the first week is the absolute hardest? Day 4 and I keep finding reasons to open Reddit.',
          likes: 11,
          replies: 14,
          liked: false,
        ),
        const SizedBox(height: 20),
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

class _PostCard extends StatefulWidget {
  const _PostCard({
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
  final String initials;
  final Color  avatarColor;
  final String name;
  final String badgeLabel;
  final Color  badgeColor;
  final String timeAgo;
  final String body;
  final int    likes;
  final int    replies;
  final bool   liked;

  @override
  State<_PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<_PostCard> {
  late bool _liked;
  late int  _likes;

  @override
  void initState() {
    super.initState();
    _liked = widget.liked;
    _likes = widget.likes;
  }

  void _toggleLike() {
    setState(() {
      _liked = !_liked;
      _likes += _liked ? 1 : -1;
    });
  }

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
              _Avatar(initials: widget.initials, bg: widget.avatarColor),
              const SizedBox(width: 9),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(widget.name,
                            style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: ClarityColors.textSecondary)),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: widget.badgeColor.withAlpha(34),
                            borderRadius: BorderRadius.circular(5),
                          ),
                          child: Text(widget.badgeLabel,
                              style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w500,
                                  color: widget.badgeColor)),
                        ),
                      ],
                    ),
                    Text(widget.timeAgo,
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
            child: Text(widget.body,
                style: const TextStyle(
                    fontSize: 13,
                    color: ClarityColors.textMuted,
                    height: 1.6)),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              GestureDetector(
                onTap: _toggleLike,
                child: Row(
                  children: [
                    Icon(TablerIcons.heart,
                        size: 16,
                        color: _liked
                            ? ClarityColors.pink
                            : ClarityColors.textDisabled),
                    const SizedBox(width: 4),
                    Text('$_likes',
                        style: TextStyle(
                            fontSize: 12,
                            color: _liked
                                ? ClarityColors.pink
                                : ClarityColors.textDisabled)),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              const Icon(TablerIcons.message_circle,
                  size: 16, color: ClarityColors.textDisabled),
              const SizedBox(width: 4),
              Text('${widget.replies} replies',
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
  const _SupportTab();

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
        _SupportCard(
          initials: 'JL',
          avatarColor: ClarityColors.tealTint,
          initColor: ClarityColors.tealLight,
          name: 'Jamie L.',
          streak: 14,
          bio: 'Been through doomscrolling addiction. Happy to listen or just keep you company.',
        ),
        const SizedBox(height: 10),
        _SupportCard(
          initials: 'TD',
          avatarColor: const Color(0xFF1A1520),
          initColor: ClarityColors.purplePale,
          name: 'Taylor D.',
          streak: 30,
          bio: '30 days in. The first week was the hardest for me too. DM me anytime.',
        ),
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
  const _SupportCard({
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
              _Avatar(initials: initials, bg: avatarColor, fg: initColor),
              const SizedBox(width: 9),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name,
                        style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: ClarityColors.textSecondary)),
                    Text('● Online now · $streak day streak',
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
            child: Text(bio,
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
  const _WinsTab();

  static const _milestones = [
    ('🏆', 'Jordan', '30 days', 'No social media'),
    ('⚡', 'Priya',  '14 days', 'Screen time under 1hr'),
    ('🌱', 'Alex',   '7 days',  'Porn-free first week'),
    ('💎', 'Sam',    '60 days', 'No doomscrolling'),
  ];

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
        ..._milestones.map((m) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _MilestoneCard(
                emoji: m.$1,
                name: m.$2,
                days: int.parse(m.$3.split(' ')[0]),
                note: m.$4,
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

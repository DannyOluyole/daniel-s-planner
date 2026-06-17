package com.example.clarity.blocking

import android.app.Activity
import android.os.Bundle
import android.os.CountDownTimer
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import com.example.clarity.R

/**
 * Full-screen overlay shown when a blocked app is opened, or when a
 * per-app open-count / time limit is reached or about to be reached.
 *
 * overlay_type extra:
 *   BLOCKED              — app is in the blocked list
 *   OPEN_LIMIT_WARNING   — this is the last allowed open today (not blocked)
 *   OPEN_LIMIT_BLOCKED   — daily open limit exceeded, blocked until tomorrow
 *   TIME_LIMIT_WARNING   — daily time limit almost used up (not blocked)
 *   TIME_LIMIT_BLOCKED   — daily time limit used up, blocked until tomorrow
 *
 * Strictness 0 (Soft)     — not triggered for BLOCKED, reminder only via notification
 * Strictness 1 (Standard) — *_BLOCKED screens show a 5-second "bypass" countdown
 * Strictness 2 (Strict)   — *_BLOCKED screens show no dismiss option
 */
class BlockedOverlayActivity : Activity() {

    private var countDownTimer: CountDownTimer? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Draw over the lock screen if needed
        window.addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
        )

        setContentView(R.layout.activity_blocked_overlay)

        val blockedPackage = intent.getStringExtra("blocked_package") ?: ""
        val strictness     = intent.getIntExtra("strictness", 1)
        val type            = intent.getStringExtra("overlay_type") ?: "BLOCKED"
        val openLimit       = intent.getIntExtra("open_limit", -1)
        val timeLimitMin    = intent.getIntExtra("time_limit_min", -1)
        val opensToday      = intent.getIntExtra("opens_today", -1)
        val secondsToday    = intent.getIntExtra("seconds_today", -1)

        val appName = packageManager.getApplicationLabel(
            packageManager.getApplicationInfo(blockedPackage, 0)
        ).toString()

        findViewById<TextView>(R.id.tv_app_name).text = appName

        val tvSubtitle = findViewById<TextView>(R.id.tv_subtitle)
        val tvMessage  = findViewById<TextView>(R.id.tv_message)
        val btnBypass  = findViewById<Button>(R.id.btn_bypass)
        val btnGoBack  = findViewById<Button>(R.id.btn_go_back)

        val isWarningOnly = type == "OPEN_LIMIT_WARNING" || type == "TIME_LIMIT_WARNING"

        when (type) {
            "OPEN_LIMIT_WARNING" -> {
                tvSubtitle.text = "last $appName open for today"
                tvMessage.text = "You've used $opensToday of $openLimit opens today.\nAfter this, $appName will be blocked until tomorrow."
            }
            "OPEN_LIMIT_BLOCKED" -> {
                tvSubtitle.text = "open limit reached"
                tvMessage.text = "You've already opened $appName $openLimit times today.\nIt unlocks again tomorrow — or turn this off in Productivity Max."
            }
            "TIME_LIMIT_WARNING" -> {
                val remaining = ((timeLimitMin * 60) - secondsToday).coerceAtLeast(0) / 60
                tvSubtitle.text = "almost out of time"
                tvMessage.text = "About $remaining min left on $appName today.\nClose it now, or keep going until your time runs out."
            }
            "TIME_LIMIT_BLOCKED" -> {
                tvSubtitle.text = "time limit reached"
                tvMessage.text = "You've used your $timeLimitMin min daily limit on $appName.\nIt unlocks again tomorrow — or turn this off in Productivity Max."
            }
            else -> {
                tvSubtitle.text = "is blocked by Productivity Max"
                tvMessage.text = "You set this block to help you stay focused.\nYou’ve got this."
            }
        }

        if (isWarningOnly) {
            // Informational only — does not block usage, just acknowledges.
            btnGoBack.visibility = android.view.View.GONE
            btnBypass.visibility = android.view.View.VISIBLE
            btnBypass.isEnabled = true
            btnBypass.text = "Got it, continue"
            btnBypass.setOnClickListener { finish() }
        } else {
            btnGoBack.visibility = android.view.View.VISIBLE
            when (strictness) {
                2 -> {
                    // Strict — no bypass
                    btnBypass.visibility = android.view.View.GONE
                }
                else -> {
                    // Standard — 5-second countdown then allow bypass
                    btnBypass.visibility = android.view.View.VISIBLE
                    btnBypass.isEnabled = false
                    countDownTimer = object : CountDownTimer(5000, 1000) {
                        override fun onTick(ms: Long) {
                            btnBypass.text = "I'll use it anyway (${ms / 1000}s)"
                        }
                        override fun onFinish() {
                            btnBypass.isEnabled = true
                            btnBypass.text = "I'll use it anyway"
                        }
                    }.start()

                    btnBypass.setOnClickListener { finish() }
                }
            }
        }

        btnGoBack.setOnClickListener {
            // Send user to home screen
            val home = android.content.Intent(android.content.Intent.ACTION_MAIN).apply {
                addCategory(android.content.Intent.CATEGORY_HOME)
                addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(home)
            finish()
        }
    }

    override fun onDestroy() {
        countDownTimer?.cancel()
        super.onDestroy()
    }

    // Prevent back button from dismissing the overlay (except informational warnings)
    override fun onBackPressed() {
        val type = intent.getStringExtra("overlay_type") ?: "BLOCKED"
        if (type == "OPEN_LIMIT_WARNING" || type == "TIME_LIMIT_WARNING") {
            finish()
        }
    }
}

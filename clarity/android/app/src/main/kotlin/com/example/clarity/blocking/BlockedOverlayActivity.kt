package com.example.clarity.blocking

import android.app.Activity
import android.os.Bundle
import android.os.CountDownTimer
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import com.example.clarity.R

/**
 * Full-screen overlay shown when a blocked app is opened.
 *
 * Strictness 0 (Soft)     — not triggered, reminder only via notification
 * Strictness 1 (Standard) — shows this screen with a 5-second "bypass" countdown
 * Strictness 2 (Strict)   — shows this screen, no dismiss option
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

        findViewById<TextView>(R.id.tv_app_name).text =
            packageManager.getApplicationLabel(
                packageManager.getApplicationInfo(blockedPackage, 0)
            ).toString()

        val btnBypass = findViewById<Button>(R.id.btn_bypass)

        when (strictness) {
            2 -> {
                // Strict — no bypass
                btnBypass.visibility = android.view.View.GONE
            }
            else -> {
                // Standard — 5-second countdown then allow bypass
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

        findViewById<Button>(R.id.btn_go_back).setOnClickListener {
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

    // Prevent back button from dismissing the overlay
    override fun onBackPressed() {}
}

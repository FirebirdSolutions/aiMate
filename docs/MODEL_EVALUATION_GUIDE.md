# Model Evaluation Guide

Evaluate and compare AI models to find out which ones work best for your needs. aiMate provides two ways to evaluate models: **Arena Mode** for blind comparisons, and **Normal Feedback** for everyday use.

---

## Quick Start

1. **Give feedback anytime**: Click the thumbs up/down on any AI response
2. **Try Arena Mode**: Click the crossed swords icon in the header to compare models side-by-side
3. **View rankings**: Go to Admin Panel > Evaluation to see the leaderboard

---

## Arena Mode (Blind Comparison)

Arena Mode is the fairest way to compare models. It shows you two responses to the same prompt without revealing which model generated which - removing any bias you might have towards a particular model.

### How to Use Arena Mode

1. **Enable Arena Mode**: Click the crossed swords icon in the header (or find it in the menu under "Arena Mode")

2. **Ask your question**: Type your prompt as normal. Instead of one response, you'll see two side-by-side:
   - **Model A** (left)
   - **Model B** (right)

3. **Compare the responses**: Read both carefully. Consider:
   - Which one answered your question better?
   - Which one is more accurate?
   - Which one is better formatted?

4. **Cast your vote**: Click one of three buttons:
   - **Model A Wins** - if the left response is better
   - **Model B Wins** - if the right response is better
   - **Tie** - if they're equally good

5. **See the results**: After voting, the model names are revealed and your vote is recorded for the leaderboard.

### Tips for Fair Evaluation

- **Vote before revealing**: Try to vote before clicking "Reveal Models" to avoid bias
- **Add topic tags**: Tag your evaluation (e.g., "coding", "creative-writing") to help with topic-specific rankings
- **Be consistent**: Apply the same standards to both responses

---

## Normal Feedback (Thumbs Up/Down)

You don't need Arena Mode to help improve model rankings. Your everyday feedback counts too!

### How to Give Feedback

1. **Find a response you want to rate**: Look for the thumbs up/down icons below any AI response

2. **Click thumbs up or down**: This opens the detailed feedback form

3. **Rate on a scale of 1-10**: Refine your rating beyond just good/bad

4. **Select behavior tags**: Choose what you liked or disliked about the response:

   | Category | Positive Tags | Negative Tags |
   |----------|---------------|---------------|
   | **Tool Use** | Correct Tool Choice, Tool Params Correct | Unnecessary Tool, Missed Tool Opportunity |
   | **General** | Factually Correct, Friendly Tone, Coherent | Hallucination |
   | **Safety** | Appropriate Refusal | Over Refusal, Unsafe Content |
   | **Instructions** | Followed Format, Complete Answer | Ignored Instruction |
   | **Code** | Working Code, Well Documented | Buggy Code |
   | **Helpfulness** | Solved Problem | Unhelpful |

5. **Add topic tags** (optional): Type custom tags like "python", "customer-service", or "essay-writing" to enable topic-specific rankings

6. **Submit**: Your feedback is saved and contributes to the leaderboard

### When Does Feedback Affect Rankings?

For your feedback to influence the leaderboard, you need a **sibling response** - another model's answer to compare against. This happens when you:

- Use Arena Mode (automatic)
- Regenerate a response with a different model
- Compare the same prompt across different conversations

---

## Leaderboard

The leaderboard shows how models rank based on all user feedback using an **Elo rating system** (like chess rankings).

### Viewing the Leaderboard

1. Open **Admin Panel** (click the menu icon)
2. Select the **Evaluation** tab
3. View rankings, stats, and performance breakdowns

### Understanding the Rankings

| Column | What It Means |
|--------|---------------|
| **Rank** | Overall position (trophy for #1, medals for #2-3) |
| **Elo Rating** | Score from head-to-head comparisons (higher = better) |
| **Win Rate** | Percentage of comparisons this model won |
| **Avg Rating** | Average user rating (1-10 scale) |
| **Evaluations** | Total number of ratings received |
| **Trend** | Recent performance change (up/down/stable) |

### Filtering the Leaderboard

- **By Provider**: See only OpenAI, Anthropic, Google, etc.
- **By Topic**: See which model is best for specific tasks (coming soon)

### Performance by Topic

The leaderboard also shows how models perform in specific areas:
- Which model is best at coding?
- Which model writes the most creative stories?
- Which model is most helpful for customer service?

This is powered by the topic tags you add to your feedback!

---

## Topic Tags

Topic tags help create specialised rankings. Instead of just "which model is best overall", you can find "which model is best for Python coding" or "which model writes the best marketing copy".

### Default Topic Categories

| Category | Example Tags |
|----------|--------------|
| Technical | `coding`, `python`, `javascript`, `devops`, `data-science` |
| Creative | `creative-writing`, `poetry`, `storytelling` |
| Academic | `research`, `analysis`, `math`, `education` |
| Professional | `business`, `legal`, `email` |
| Communication | `translation`, `advice` |

### Auto-Tagging

aiMate can automatically suggest tags based on your conversation content. Look for suggested tags when giving feedback - you can accept, modify, or add your own.

### Adding Custom Tags

1. In the feedback form, find the "Topic Tags" section
2. Type your custom tag (e.g., "react-hooks", "nz-law", "recipe")
3. Press Enter or click + to add it
4. Add as many tags as relevant

---

## Exporting Evaluation Data

Your evaluations can be exported for model fine-tuning or analysis.

### How to Export

1. Go to **Admin Panel > Evaluation**
2. Click the **Download** icon
3. Choose your format:
   - **JSON** - structured data for programmatic use
   - **JSONL** - one record per line, good for training
   - **CSV** - spreadsheet-compatible

### What's Included

Each export contains:
- The original prompt
- The model's response
- Your rating (1-10)
- Tags you selected
- Timestamp
- Model identifier

### Privacy Note

Exports only include your own evaluations. In multi-user deployments, admins may have access to aggregated (anonymised) data.

---

## Frequently Asked Questions

### Q: Does my feedback actually matter?

**Yes!** Every rating contributes to the leaderboard rankings. The more people evaluate, the more accurate the rankings become.

### Q: What's the difference between Arena Mode and normal feedback?

**Arena Mode** gives you blind, side-by-side comparisons for unbiased evaluation. **Normal feedback** lets you rate responses as you chat naturally. Both contribute to rankings, but Arena Mode is considered more reliable for comparative rankings.

### Q: How is the Elo rating calculated?

The Elo system is borrowed from chess. When Model A beats Model B:
- If A was expected to win: small rating change
- If A was the underdog: big rating change
- Ties split the points

This means upsets matter more than expected victories.

### Q: Can I edit or delete my feedback?

Currently, feedback is final once submitted. We're working on adding edit/delete functionality.

### Q: Why can't I see some models on the leaderboard?

Models need a minimum number of evaluations (usually 10) before appearing on the leaderboard. This prevents unreliable rankings from small sample sizes.

### Q: What are "sibling messages"?

A sibling message is an alternative response to the same prompt - like when you regenerate a response or use Arena Mode. Comparing siblings is how we calculate head-to-head rankings.

---

## Best Practices

1. **Be specific with tags**: "python-debugging" is more useful than just "coding"

2. **Rate honestly**: Don't just thumbs-up everything - nuanced feedback improves rankings

3. **Use Arena Mode for important decisions**: If you're choosing between models for a project, Arena Mode gives you unbiased data

4. **Check the leaderboard before selecting a model**: See which models excel at your type of task

5. **Add comments**: The text feedback helps explain why you rated something the way you did

---

## Getting Help

If you have questions about model evaluation:

- Check the **Help & FAQ** in the menu
- Report issues at [github.com/anthropics/claude-code/issues](https://github.com/anthropics/claude-code/issues)

Happy evaluating!

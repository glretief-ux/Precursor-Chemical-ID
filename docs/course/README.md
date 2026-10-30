# Precursor Chemicals course (EN / FR)

Open `index.html` (published at `.../Precursor-Chemical-ID/course/`). Add `#en` or `#fr` to the link to choose the language.

## Collecting results (Google Form)
1. Create a Google Form with short-answer questions: Name, Trainer, Language, Score, Passed, Date (optional: Best score, Out of).
2. In the Form menu choose "Get pre-filled link", fill each question with a sample, and copy the link. It contains `entry.NNN=` ids.
3. Put the Form address (replace `viewform` with `formResponse`) in `config.js` as `formUrl`, and the entry ids under `fields`.
4. Open the Form's Responses tab, link it to a Google Sheet, and share that Sheet with the trainers.

Without a Form, learners get a button to copy their result (or email it if `mailto` is set in `config.js`).

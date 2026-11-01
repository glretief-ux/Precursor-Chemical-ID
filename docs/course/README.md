# Precursor Chemicals course (EN / FR)

Open `index.html` (published at `.../Precursor-Chemical-ID/course/`, bilingual; add `#en` or `#fr`). Single-language versions: `course/en/` and `course/fr/`. Videos only: `videos/`.

## Trainers: links and results
The course opens **blank for every visitor** (nothing is remembered on the device).
1. Open `course/trainer.html`, enter your e-mail address and copy your links (English, French or bilingual). Each link ends with `?t=your@email`.
2. Send that link to your participants. When they finish, the button "Send my result to my trainer" opens an e-mail to you with their name, score, pass/fail and date. The participant presses Send in their own mail app.
3. Automatic e-mail without the participant pressing Send needs a relay service. Option: set `relay:"formsubmit"` in `config.js`; results are then posted to formsubmit.co, which e-mails the trainer in the link (the trainer confirms their address once). This sends learner names and scores through a third party, so it is off by default.

## Collecting results in a sheet (optional, Google Form)
1. Create a Google Form with short-answer questions: Name, Trainer, Language, Score, Passed, Date (optional: Best score, Out of).
2. In the Form menu choose "Get pre-filled link", fill each question with a sample, and copy the link. It contains `entry.NNN=` ids.
3. Put the Form address (replace `viewform` with `formResponse`) in `config.js` as `formUrl`, and the entry ids under `fields`.
4. Open the Form's Responses tab, link it to a Google Sheet, and share that Sheet with the trainers.

Without a Form, learners get a button to copy their result (or email it if `mailto` is set in `config.js`).

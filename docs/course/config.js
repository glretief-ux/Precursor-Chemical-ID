/* Where results go. Fill in after creating the Google Form (see README in this folder). */
window.COURSE_CONFIG={
  formUrl:"",   /* https://docs.google.com/forms/d/e/FORM_ID/formResponse */
  fields:{      /* entry ids from the Form, e.g. name:"entry.123456789" */
    name:"",trainer:"",lang:"",score:"",best:"",total:"",passed:"",date:""
  },
  mailto:"",    /* optional default trainer email, used when the link has no ?t= trainer address */
  relay:"formsubmit",  /* e-mails every finished result automatically through formsubmit.co */
  relayId:"717eca28dade7f52a33cb80106c79d9a"    /* private endpoint id from the activation e-mail (hides the real address) */
};

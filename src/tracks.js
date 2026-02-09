// ConfigVariations and getRandomOffset imports removed - not used in this file

const tracks = [
  {
    url: "2000/kenet-cemik_melody.xm",
    year: "2000",
    author: ["kenet", "cemik"],
    filename: "melody.xm",
    bleep: true,
  },
  {
    url: "2000/kenet-nagz_zouz.xm",
    year: "2000",
    author: ["kenet", "nagz"],
    filename: "zouz.xm",
    bleep: true,
  },
  {
    url: "2000/kenet-rez_myown.xm",
    year: "2000",
    author: ["kenet", "rez"],
    filename: "myown.xm",
    bleep: true,
  },
  {
    url: "2000/kenet_ana.xm",
    year: "2000",
    author: ["kenet"],
    filename: "ana.xm",
    bleep: true,
  },
  {
    url: "2000/kenet_beauty.mod",
    year: "2000",
    author: ["kenet"],
    filename: "beauty.mod",
    bleep: true,
  },
  {
    url: "2000/kenet_funky.xm",
    year: "2000",
    author: ["kenet"],
    filename: "funky.xm",
    bleep: true,
  },
  {
    url: "2000/kenet_paris.xm",
    year: "2000",
    author: ["kenet"],
    filename: "paris.xm",
    bleep: true,
  },
  {
    url: "2000/kenet_redflower.mod",
    year: "2000",
    author: ["kenet"],
    filename: "redflower.mod",
    bleep: true,
  },
  {
    url: "2000/kenet_santa.mod",
    year: "2000",
    author: ["kenet"],
    filename: "santa.mod",
    bleep: true,
  },
  {
    url: "2000/kenet_sinvibe.xm",
    year: "2000",
    author: ["kenet"],
    filename: "sinvibe.xm",
  },
  {
    url: "2000/ks_htones.xm",
    year: "2000",
    author: ["ks"],
    filename: "htones.xm",
  },
  {
    url: "2000/med-kenet_coeur.xm",
    year: "2000",
    author: ["med", "kenet"],
    filename: "coeur.xm",
    bleep: true,
  },
  {
    url: "2000/med-kenet_zougi.mod",
    year: "2000",
    author: ["med", "kenet"],
    filename: "zougi.mod",
    bleep: true,
  },
  {
    url: "2000/med_2000.xm",
    year: "2000",
    author: ["med"],
    filename: "2000.xm",
    bleep: true,
  },
  {
    url: "2000/med_cho7.xm",
    year: "2000",
    author: ["med"],
    filename: "cho7.xm",
    bleep: true,
  },
  {
    url: "2000/med_coline.xm",
    year: "2000",
    author: ["med"],
    filename: "coline.xm",
    bleep: true,
  },
  {
    url: "2000/med_dartagna.xm",
    year: "2000",
    author: ["med"],
    filename: "dartagna.xm",
  },
  {
    url: "2000/med_nia.xm",
    year: "2000",
    author: ["med"],
    filename: "nia.xm",
    bleep: true,
  },
  {
    url: "2000/med_poisson.xm",
    year: "2000",
    author: ["med"],
    filename: "poisson.xm",
    bleep: true,
  },
  {
    url: "2000/med_potager.xm",
    year: "2000",
    author: ["med"],
    filename: "potager.xm",
    bleep: true,
  },
  {
    url: "2000/med_rakiz.xm",
    year: "2000",
    author: ["med"],
    filename: "rakiz.xm",
    bleep: true,
  },
  {
    url: "2000/med-kenet_nopseeking.xm",
    year: "2000",
    author: ["med", "kenet"],
    filename: "nopseeking.xm",
    bleep: true,
  },
  {
    url: "2000/med_lepiedgauche.xm",
    year: "2000",
    author: ["med"],
    filename: "lepiedgauche.xm",
    bleep: true,
  },
  {
    url: "2000/med_lepouletestcuit.xm",
    year: "2000",
    author: ["med"],
    filename: "lepouletestcuit.xm",
    bleep: true,
  },
  {
    url: "2000/med_boite.xm",
    year: "2000",
    author: ["med"],
    filename: "boite.xm",
    bleep: true,
  },
  {
    url: "2000/med_jibetheme.xm",
    year: "2000",
    author: ["med"],
    filename: "jibetheme.xm",
    bleep: true,
  },
  {
    url: "2000/med_lacrottequiparle.xm",
    year: "2000",
    author: ["med"],
    filename: "lacrottequiparle.xm",
    bleep: true,
  },
  {
    url: "2000/nagz-genuis_kpon.xm",
    year: "2000",
    author: ["nagz", "genuiz"],
    filename: "kpon.xm",
    bleep: true,
  },
  {
    url: "2000/nagz_mioy.xm",
    year: "2000",
    author: ["nagz"],
    filename: "mioy.xm",
    bleep: true,
  },
  {
    url: "2000/blbblb_xmas.xm",
    year: "2000",
    author: ["nagz"],
    filename: "xmas.xm",
    bleep: true,
  },
  {
    url: "2000/nagz_mycv.xm",
    year: "2000",
    author: ["nagz"],
    filename: "mycv.xm",
  },
  {
    url: "2000/nagz_suxy.xm",
    year: "2000",
    author: ["nagz"],
    filename: "suxy.xm",
  },
  {
    url: "2000/redribbon-poulpy_elyxiis.xm",
    year: "2000",
    author: ["redribbon", "poulpy"],
    filename: "elyxiis.xm",
    bleep: true,
  },
  {
    url: "2000/redribbon_pulp.xm",
    year: "2000",
    author: ["redribbon"],
    filename: "pulp.xm",
  },
  {
    url: "2000/redribbon_redmo2final.xm",
    year: "2000",
    author: ["redribbon"],
    filename: "redmo2final.xm",
    bleep: true,
  },
  {
    url: "2000/traven_mario.xm",
    year: "2000",
    author: ["traven"],
    filename: "mario.xm",
    bleep: true,
  },
  {
    url: "2000/traven_scene-city.xm",
    year: "2000",
    author: ["traven"],
    filename: "scene-city.xm",
    bleep: true,
  },
  {
    url: "2000/traven_syndrome.xm",
    year: "2000",
    author: ["traven"],
    filename: "syndrome.xm",
  },
  {
    url: "2000/unaware_callfrom.xm",
    year: "2000",
    author: ["unaware"],
    filename: "callfrom.xm",
    bleep: true,
  },
  {
    url: "2000/willbe_aeroplane.it",
    year: "2000",
    author: ["willbe"],
    filename: "aeroplane.it",
  },
  {
    url: "2000/willbe_minich4tr.it",
    year: "2000",
    author: ["willbe"],
    filename: "minich4tr.it",
  },
  {
    url: "2000/willbe_minidrktow.it",
    year: "2000",
    author: ["willbe"],
    filename: "minidrktow.it",
  },
  {
    url: "2000/willbe_miniwash.it",
    year: "2000",
    author: ["willbe"],
    filename: "miniwash.it",
  },
  {
    url: "2001/bacter-dna_emotions.it",
    year: "2001",
    author: ["bacter", "dna-groove"],
    filename: "emotions.it",
    shader: 0,
  },
  {
    url: "2001/bacter-keen-vhiiula_sbrk.it",
    year: "2001",
    author: ["bacter", "keen", "vhiiula"],
    filename: "sbrk.it",
  },
  {
    url: "2001/bacter-vhiiula_head.it",
    year: "2001",
    author: ["bacter", "vhiiula"],
    filename: "head.it",
  },
  {
    url: "2001/cemik-nagz_twnd.xm",
    year: "2001",
    author: ["cemik", "nagz"],
    filename: "twnd.xm",
    bleep: true,
  },
  {
    url: "2001/edzes_cec_2000.xm",
    year: "2001",
    author: ["edzes"],
    filename: "cec",
    bleep: true,
  },
  {
    url: "2001/edzes_teddy.xm",
    year: "2001",
    author: ["edzes"],
    filename: "teddy.xm",
    bleep: true,
  },
  {
    url: "2001/keen_falseend.it",
    year: "2001",
    author: ["keen"],
    filename: "falseend.it",
  },
  {
    url: "2001/keen_hsf.it",
    year: "2001",
    author: ["keen"],
    filename: "hsf.it",
  },
  {
    url: "2001/med_2voices2.xm",
    year: "2001",
    author: ["med"],
    filename: "2voices2.xm",
  },
  {
    url: "2001/med_3vil.xm",
    year: "2001",
    author: ["med"],
    filename: "3vil.xm",
    bleep: true,
  },
  {
    url: "2001/med_curry.xm",
    year: "2001",
    author: ["med"],
    filename: "curry.xm",
  },
  {
    url: "2001/med_deep.xm",
    year: "2001",
    author: ["med"],
    filename: "deep.xm",
    bleep: true,
  },
  {
    url: "2001/med_kickass.xm",
    year: "2001",
    author: ["med"],
    filename: "kickass.xm",
    bleep: true,
  },
  {
    url: "2001/med_mini2.xm",
    year: "2001",
    author: ["med"],
    filename: "mini2.xm",
  },
  {
    url: "2001/med_smileit.xm",
    year: "2001",
    author: ["med"],
    filename: "smileit.xm",
    bleep: true,
  },
  {
    url: "2001/med_dotflower.xm",
    year: "2001",
    author: ["med"],
    filename: "dotflower.xm",
  },
  {
    url: "2001/med_earth.xm",
    year: "2001",
    author: ["med"],
    filename: "earth.xm",
  },
  {
    url: "2001/med_offline.xm",
    year: "2001",
    author: ["med"],
    filename: "offline.xm",
  },
  {
    url: "2001/med_health.xm",
    year: "2001",
    author: ["med"],
    filename: "health.xm",
  },
  {
    url: "2001/med_human.xm",
    year: "2001",
    author: ["med"],
    filename: "human.xm",
  },
  {
    url: "2001/med_landscap.xm",
    year: "2001",
    author: ["med"],
    filename: "landscap.xm",
  },
  {
    url: "2001/med_nation.xm",
    year: "2001",
    author: ["med"],
    filename: "nation.xm",
  },
  {
    url: "2001/med_vegetal.xm",
    year: "2001",
    author: ["med"],
    filename: "vegetal.xm",
  },
  {
    url: "2001/med_mirrorcube.xm",
    year: "2001",
    author: ["med"],
    filename: "mirrorcube.xm",
  },
  {
    url: "2001/med_misc.xm",
    year: "2001",
    author: ["med"],
    filename: "misc.xm",
  },
  {
    url: "2001/med_newschool.xm",
    year: "2001",
    author: ["med"],
    filename: "newschool.xm",
  },
  {
    url: "2001/nagz-drax_rnth.xm",
    year: "2001",
    author: ["nagz", "drax"],
    filename: "rnth.xm",
  },
  {
    url: "2001/nagz-kenet_bckd.xm",
    year: "2001",
    author: ["nagz", "kenet"],
    filename: "bckd.xm",
    bleep: true,
  },
  {
    url: "2001/nagz_anlg.mod",
    year: "2001",
    author: ["nagz"],
    filename: "anlg.mod",
  },
  {
    url: "2001/nagz_fcky.xm",
    year: "2001",
    author: ["nagz"],
    filename: "fcky.xm",
  },
  {
    url: "2001/nagz_hmsp.xm",
    year: "2001",
    author: ["nagz"],
    filename: "hmsp.xm",
  },
  {
    url: "2001/nagz_inmw.xm",
    year: "2001",
    author: ["nagz"],
    filename: "inmw.xm",
  },
  {
    url: "2001/nagz_mtie.xm",
    year: "2001",
    author: ["nagz"],
    filename: "mtie.xm",
  },
  {
    url: "2001/nagz_mtsp.xm",
    year: "2001",
    author: ["nagz"],
    filename: "mtsp.xm",
  },
  {
    url: "2001/nagz_rboa.xm",
    year: "2001",
    author: ["nagz"],
    filename: "rboa.xm",
  },
  {
    url: "2001/nagz_rwsp.xm",
    year: "2001",
    author: ["nagz"],
    filename: "rwsp.xm",
  },
  {
    url: "2001/redribbon-med_upermarch.xm",
    year: "2001",
    author: ["redribbon", "med"],
    filename: "upermarch.xm",
  },
  {
    url: "2001/redribbon_cahouin.xm",
    year: "2001",
    author: ["redribbon"],
    filename: "cahouin.xm",
  },
  {
    url: "2001/skybax_purp.it",
    year: "2001",
    author: ["skybax"],
    filename: "purp.it",
    bleep: true,
  },
  {
    url: "2001/skybax_rain.it",
    year: "2001",
    author: ["skybax"],
    filename: "rain.it",
  },
  {
    url: "2001/tomaes_tan2.xm",
    year: "2001",
    author: ["tomaes"],
    filename: "tan2.xm",
    bleep: true,
  },
  {
    url: "2001/unaware_mboxchip.xm",
    year: "2001",
    author: ["unaware"],
    filename: "mboxchip.xm",
  },
  {
    url: "2001/vhiiula_bal.it",
    year: "2001",
    author: ["vhiiula"],
    filename: "bal.it",
  },
  {
    url: "2001/vhiiula_etan.it",
    year: "2001",
    author: ["vhiiula"],
    filename: "etan.it",
  },
  {
    url: "2001/vhiiula_klam.it",
    year: "2001",
    author: ["vhiiula"],
    filename: "klam.it",
  },
  {
    url: "2001/vhiiula_misz.it",
    year: "2001",
    author: ["vhiiula"],
    filename: "misz.it",
  },
  {
    url: "2001/vhiiula_prel.it",
    year: "2001",
    author: ["vhiiula"],
    filename: "prel.it",
  },
  {
    url: "2001/vhiiula_tanx.it",
    year: "2001",
    author: ["vhiiula"],
    filename: "tanx.it",
  },
  {
    url: "2001/wayfinder_gb01.it",
    year: "2001",
    author: ["wayfinder"],
    filename: "gb01.it",
    bleep: true,
  },
  {
    url: "2001/wayfinder_mario.it",
    year: "2001",
    author: ["wayfinder"],
    filename: "mario.it",
    bleep: true,
  },
  {
    url: "2002/bacter_insidemyoldschoolpc.it",
    year: "2002",
    author: ["bacter"],
    filename: "insidemyoldschoolpc.it",
  },
  {
    url: "2002/dualtrax_crosnake.xm",
    year: "2002",
    author: ["dualtrax"],
    filename: "crosnake.xm",
    bleep: true,
  },
  {
    url: "2002/dualtrax_orion.xm",
    year: "2002",
    author: ["dualtrax"],
    filename: "orion.xm",
    bleep: true,
  },
  {
    url: "2002/dualtrax_radiatorsgrill.xm",
    year: "2002",
    author: ["dualtrax"],
    filename: "radiatorsgrill.xm",
    bleep: true,
  },
  {
    url: "2002/ernestoaeroflot_joinme.xm",
    year: "2002",
    author: ["ernestoaeroflot"],
    filename: "joinme.xm",
  },
  {
    url: "2002/jashiin_9320000.it",
    year: "2002",
    author: ["jashiin"],
    filename: "9320000.it",
  },
  {
    url: "2002/jashiin_convincingconvexity.s3m",
    year: "2002",
    author: ["jashiin"],
    filename: "convincingconvexity.s3m",
  },
  {
    url: "2002/jashiin_huomenta.it",
    year: "2002",
    author: ["jashiin"],
    filename: "huomenta.it",
  },
  {
    url: "2002/jashiin_kylmyys.it",
    year: "2002",
    author: ["jashiin"],
    filename: "kylmyys.it",
  },
  {
    url: "2002/jashiin_mansikka.it",
    year: "2002",
    author: ["jashiin"],
    filename: "mansikka.it",
  },
  {
    url: "2002/jashiin_nohands.it",
    year: "2002",
    author: ["jashiin"],
    filename: "nohands.it",
  },
  {
    url: "2002/nagz_makingmusic.xm",
    year: "2002",
    author: ["nagz"],
    filename: "makingmusic.xm",
  },
  {
    url: "2002/nagz_milk.xm",
    year: "2002",
    author: ["nagz"],
    filename: "milk.xm",
  },
  {
    url: "2002/nagz_mydoglivesonthemoon.xm",
    year: "2002",
    author: ["nagz"],
    filename: "mydoglivesonthemoon.xm",
  },
  {
    url: "2002/unaware-forsaken_thelight.xm",
    year: "2002",
    author: ["unaware", "forsaken"],
    filename: "thelight.xm",
  },
  {
    url: "2002/unaware-keyg_help.xm",
    year: "2002",
    author: ["unaware", "keyg"],
    filename: "help.xm",
    bleep: true,
  },
  {
    url: "2002/unaware_brainles.xm",
    year: "2002",
    author: ["unaware"],
    filename: "brainles.xm",
  },
  {
    url: "2002/unaware_chece.xm",
    year: "2002",
    author: ["unaware"],
    filename: "chece.xm",
  },
  {
    url: "2002/unaware_evuole.xm",
    year: "2002",
    author: ["unaware"],
    filename: "evuole.xm",
  },
  {
    url: "2002/unaware_nap.xm",
    year: "2002",
    author: ["unaware"],
    filename: "nap.xm",
  },
  {
    url: "2002/unaware_stereophonik2001.xm",
    year: "2002",
    author: ["unaware"],
    filename: "stereophonik2001.xm",
  },
  {
    url: "2002/unaware_untitled.xm",
    year: "2002",
    author: ["unaware"],
    filename: "untitled.xm",
  },
  {
    url: "2002/vhiiula_darkservant.it",
    year: "2002",
    author: ["vhiiula"],
    filename: "darkservant.it",
    bleep: true,
  },
  {
    url: "2002/vhiiula_dork.it",
    year: "2002",
    author: ["vhiiula"],
    filename: "dork.it",
    bleep: true,
  },
  {
    url: "2002/vhiiula_partytrackered.it",
    year: "2002",
    author: ["vhiiula"],
    filename: "partytrackered.it",
    bleep: true,
  },
  {
    url: "2002/vhiiula_whynotsendflowers.it",
    year: "2002",
    author: ["vhiiula"],
    filename: "whynotsendflowers.it",
    bleep: true,
  },
  {
    url: "2002/xerxes-nezcafe.it",
    year: "2002",
    author: ["xerxes"],
    filename: "nezcafe.it",
  },
  {
    url: "2002/xerxes_circleofshit.xm",
    year: "2002",
    author: ["xerxes"],
    filename: "circleofshit.xm",
    bleep: true,
  },
  {
    url: "2002/nagz_runjump.xm",
    year: "2002",
    author: ["nagz"],
    filename: "runjump.xm",
    bleep: true,
  },
  {
    url: "2002/vhiiula_greensnow.it",
    year: "2002",
    author: ["vhiiula"],
    filename: "greensnow.it",
    bleep: true,
  },
  {
    url: "2002/vhiiula_jaipas.it",
    year: "2002",
    author: ["vhiiula"],
    filename: "jaipas.it",
  },
];

// tracks.sort(compare);
let pos = 1;
let startShader = 11;
const endShader = 16;
for (let t in tracks) {
  // const confOffset = getRandomOffset(
  //   ConfigVariations,
  //   tracks[t - 1] ? tracks[t - 1].shader : -1
  // );
  tracks[t].shader = startShader;
  startShader++;
  if (startShader > endShader) {
    startShader = 1;
  }

  tracks[t].pos = pos;
  pos++;
}

export { tracks };

const isTrackYear = (item, year) => {
  if (!year || item.year === year) {
    return true;
  }
  return false;
};

const isSelected = (track, selection) => {
  if (selection === "bleep" && track.bleep) {
    return true;
  } else if (
    selection === "selecta" &&
    (!track.bleep || track.bleep !== true)
  ) {
    return true;
  } else if (selection === "all") {
    return true;
  }
  return false;
};

export function getAuthors(year, selection) {
  const authors = [];
  for (let item of tracks) {
    let insert = false;

    if (selection === "all" && !year) {
      insert = true;
    } else if (isTrackYear(item, year) && isSelected(item, selection)) {
      insert = true;
    }

    if (!insert) {
      continue;
    }
    for (let author of item.author) {
      if (!authors.includes(author)) {
        authors.push(author);
      }
    }
  }
  authors.sort();
  return authors;
}

export const getTracksByAuthor = (author) => {
  const authorTracks = [];
  for (let track of tracks) {
    if (track.author.includes(author)) {
      authorTracks.push(track);
    }
  }
  return authorTracks;
};

export const getTracksCoop = (author) => {
  const authorTrack = getTracksByAuthor(author);
  let coop = 0;
  for (let track of authorTrack) {
    if (track.author.length > 1) {
      coop++;
    }
  }
  return coop;
};

export function getYears() {
  const years = [];
  for (let item of tracks) {
    if (!years.includes(item.year)) {
      years.push(item.year);
    }
  }
  years.sort();
  return years;
}

function compare(a, b) {
  const field = "year";
  const reverse = 1;
  if (a[field] < b[field]) {
    return -1 * reverse;
  }
  if (a[field] > b[field]) {
    return 1 * reverse;
  }
  return 0;
}

export function getTracks(year, author, selection) {
  const selectedTracks = [];
  for (let track of tracks) {
    let insert = false;
    if (year !== 0 && author !== 0 && selection.toLowerCase() !== "all") {
      if (
        isTrackYear(track, year) &&
        track.author.includes(author) &&
        isSelected(track, selection)
      ) {
        insert = true;
      }
    } else if (author !== 0 && selection.toLowerCase() !== "all") {
      if (track.author.includes(author) && isSelected(track, selection)) {
        insert = true;
      }
    } else if (year !== 0 && selection.toLowerCase() !== "all") {
      if (isTrackYear(track, year) & isSelected(track, selection)) {
        insert = true;
      }
    } else if (year !== 0 && author !== 0) {
      if (isTrackYear(track, year) && track.author.includes(author)) {
        insert = true;
      }
    } else if (author !== 0 && track.author.includes(author)) {
      insert = true;
    } else if (year !== 0 && isTrackYear(track, year)) {
      insert = true;
    } else if (selection !== "all" && isSelected(track, selection)) {
      insert = true;
    } else if (year === 0 && author === 0 && selection === "all") {
      insert = true;
    }

    if (insert) {
      selectedTracks.push(track);
    }
  }

  selectedTracks.sort(compare);

  return selectedTracks;
}


export const getTrackByPos = (pos) => {
  return tracks[pos - 1] ? tracks[pos - 1] : false;
};

/* eslint-disable no-use-before-define, no-unused-vars */
import { message } from 'antd';
import * as moment from 'moment';

import ValidationConstants from 'themes/validationConstant';
import {
  getUserId,
  getAuthToken,
  getLiveScoreCompetiton,
  getOrganisationData,
  getUmpireCompetitionData,
  getUmpireCompetitionId,
} from 'util/sessionStorage';
import history from 'util/history';
import { isArrayNotEmpty, regexNumberExpression } from 'util/helpers';
import http from './liveScoreHttp';

async function logout() {
  await localStorage.clear();
  history.push('/');
}

const token = getAuthToken();
// let userId = getUserId();

function checlfixedDurationForBulkMatch(data) {
  let url = '';

  if (data.hours || data.minutes || data.seconds) {
    if (data.hours && data.minutes && data.seconds) {
      url = `&hours=${data.hours}&minutes=${data.minutes}&seconds=${data.seconds}`;
    } else if (data.hours && data.minutes) {
      url = `&hours=${data.hours}&minutes=${data.minutes}`;
    } else if (data.hours && data.seconds) {
      url = `&hours=${data.hours}&seconds=${data.seconds}`;
    } else if (data.minutes && data.seconds) {
      url = `&minutes=${data.minutes}&seconds=${data.seconds}`;
    } else if (data.hours) {
      url = `&hours=${data.hours}`;
    } else if (data.minutes) {
      url = `&minutes=${data.minutes}`;
    } else {
      url = `&seconds=${data.seconds}`;
    }
  }

  return url;
}

function checkVenueCourtId(data) {
  const courtId = isArrayNotEmpty(data.courtId) ? data.courtId : [];
  let url = null;
  if (data.venueId) {
    if (data.venueId && courtId.length > 0) {
      url = `&venueId=${data.venueId}&courtId=${data.courtId}`;
    } else {
      url = `&venueId=${data.venueId}`;
    }
  }

  if (data.roundId) {
    url += `&roundId=${data.roundId}`;
  }

  return url;
}

const LiveScoreAxiosApi = {
  createPlayerSuspension(data) {
    const url = '/suspension/';

    return Method.dataPost(url, token, data.body);
  },
  updatePlayerSuspension(suspensionId, data) {
    const url = `/suspension/?id=${suspensionId}`;

    return Method.dataPatch(url, token, data.body);
  },
  livescoreMatchDetails(data, isLineup) {
    const url = `/matches/admin/${data}?lineups=${isLineup}`;
    // let url = `/matches/admin/${data}`
    return Method.dataGet(url, null);
  },

  liveScoreGetDivision(data, compKey, sortBy, sortOrder, isParent, compOrgId) {
    let url = null;
    if (isParent !== true && compOrgId !== undefined) {
      if (compKey) {
        url = `/division?competitionKey=${compKey}&competitionOrganisationIds=${compOrgId}`;
      } else {
        url = `/division?competitionId=${data}&competitionOrganisationIds=${compOrgId}`;
      }
    } else {
      if (compKey) {
        url = `/division?competitionKey=${compKey}`;
      } else {
        url = `/division?competitionId=${data}`;
      }
    }

    if (sortBy && sortOrder) {
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    }

    return Method.dataGet(url, null);
  },

  liveScoreGetAffiliate(data) {
    let url = '';
    if (data.name) {
      url = `linkedCompetitionOrganisation/name=${data.name}&competitionId=${data.id}`;
    } else {
      url = `linkedCompetitionOrganisation?competitionId=${data.id}`;
    }
    return Method.dataGet(url, null);
  },

  liveScoreAddNewTeam(data) {
    const url = '/teams/add';
    return Method.dataPost(url, null, data);
  },

  liveScoreSettingPost(data) {
    const venueString = JSON.stringify(data.venue);
    const url = `competitions?venues=${venueString}`;

    return Method.dataPost(url, null, data.body);
  },

  liveScoreSettingView(data) {
    const url = `/competitions/id/${data}`;
    return Method.dataGet(url, null);
  },

  liveScoreCompetitionDelete(data) {
    const url = `/competitions/id/${data}`;
    return Method.dataDelete(url, localStorage.token);
  },

  liveScoreCompetition(
    data,
    year,
    orgKey,
    recordUmpireTypes,
    sortBy,
    sortOrder,
    isumpiredCompsOnly,
    isParticipating,
  ) {
    let umpiredCompsOnly = isumpiredCompsOnly ? isumpiredCompsOnly : false;
    let isParticipatingInCompetition = isParticipating ? isParticipating : false;
    let url = null;
    if (orgKey) {
      if (recordUmpireTypes) {
        url = `/competitions/admin?organisationId=${orgKey}&recordUmpireType=${recordUmpireTypes}&umpiredCompsOnly=${umpiredCompsOnly}&isParticipatingInCompetition=${isParticipatingInCompetition}`;
      } else {
        url = `/competitions/admin?organisationId=${orgKey}&umpiredCompsOnly=${umpiredCompsOnly}&isParticipatingInCompetition=${isParticipatingInCompetition}`;
      }
    } else {
      url = '/competitions/admin';
    }

    if (sortBy && sortOrder) {
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    }

    if (data) {
      return Method.dataPost(url, null, data);
    }
    return Method.dataPost(url, null);
  },

  liveScorePlayerList(competitionID, teamId) {
    let url = null;

    if (teamId) {
      url = `/players?competitionId=${competitionID}&teamId=${teamId}`;
    } else {
      url = `/players?competitionId=${competitionID}`;
    }

    return Method.dataGet(url, localStorage.token);
  },

  liveScorePlayerSearchList(competitionID, organisationId, name) {
    const url = `/players?competitionId=${competitionID}&organisationId=${organisationId}&name=${name}&includeLinkedCompetition=true`;

    return Method.dataGet(url, localStorage.token);
  },

  // liveScoreDivision(competitionID) {
  //     const url = `/division?competitionId=${competitionID}`;
  //     return Method.dataGet(url, localStorage.token);
  // },

  // liveScoreLadderDivision(competitionID) {
  //     const url = `/division?competitionId=${competitionID}`;
  //     return Method.dataGet(url, token)
  // },

  liveScoreLadderList(divisionId, competitionID, compKey) {
    // let url = null
    // if (compKey) {
    //     url = `/teams/ladder?divisionIds=${divisionId}&competitionKey=${compKey}`;
    // } else {
    //     url = `/teams/ladder?divisionIds=${divisionId}&competitionIds=${competitionID}`;
    // }

    // return Method.dataGet(url, localStorage.token)

    const payload = {
      competitionId: compKey,
      divisionId,
    };

    const url = '/teams/ladder/web';
    return Method.dataPost(url, localStorage.token, payload);
  },

  liveScoreMatchList(
    competitionID,
    start,
    offset,
    limit,
    search,
    divisionId,
    roundName,
    teamId,
    sortBy,
    sortOrder,
    competitionOrganisationId,
  ) {
    let url;
    if (teamId !== undefined) {
      url = `/matches?competitionId=${competitionID}&divisionIds=${divisionId}&teamIds=${teamId}&competitionOrganisationId=${competitionOrganisationId}`;
    } else if (divisionId && roundName) {
      // eslint-disable-next-line max-len
      url = `/matches?competitionId=${competitionID}&start=${start}&offset=${offset}&limit=${limit}&search=${search}&divisionIds=${divisionId}&roundName=${roundName}&competitionOrganisationId=${competitionOrganisationId}`;
    } else if (divisionId) {
      url = `/matches?competitionId=${competitionID}&start=${start}&offset=${offset}&limit=${limit}&search=${search}&divisionIds=${divisionId}&competitionOrganisationId=${competitionOrganisationId}`;
    } else if (roundName) {
      url = `/matches?competitionId=${competitionID}&start=${start}&offset=${offset}&limit=${limit}&search=${search}&roundName=${roundName}&competitionOrganisationId=${competitionOrganisationId}`;
    } else {
      url = `/matches?competitionId=${competitionID}&start=${start}&offset=${offset}&limit=${limit}&search=${search}&competitionOrganisationId=${competitionOrganisationId}`;
    }

    if (sortBy && sortOrder) {
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    }
    return Method.dataGet(url, localStorage.token);
  },

  liveScoreMatchSheetDownloadList(competitionId) {
    const url = `/matches/downloads?competitionId=${competitionId}`;
    return Method.dataGet(url, token);
  },

  liveScoreTeam(competitionID, divisionId, compOrgId) {
    let url;
    if (divisionId) {
      url = `/teams/list?competitionId=${competitionID}&competitionOrganisationId=${compOrgId}&divisionId=${divisionId}&includeBye=1`;
    } else {
      url = `/teams/list?competitionId=${competitionID}&competitionOrganisationId=${compOrgId}`;
    }

    return Method.dataGet(url, localStorage.token);
  },

  liveScoreRound(competitionID, divisionId, isParent, compOrgId) {
    let url;
    if (isParent !== true && compOrgId !== undefined) {
      if (divisionId) {
        url = `/round?competitionId=${competitionID}&divisionId=${divisionId}&competitionOrganisationIds=${compOrgId}`;
      } else {
        url = `/round?competitionId=${competitionID}&competitionOrganisationIds=${compOrgId}`;
      }
    } else {
      if (divisionId) {
        url = `/round?competitionId=${competitionID}&divisionId=${divisionId}`;
      } else {
        url = `/round?competitionId=${competitionID}`;
      }
    }

    return Method.dataGet(url, localStorage.token);
  },

  liveScoreCreateRound(roundName, sequence, competitionID, divisionId) {
    const body = JSON.stringify({
      name: roundName,
      sequence,
      competitionId: competitionID,
      divisionId,
    });

    const url = '/round';
    return Method.dataPost(url, localStorage.token, body);
  },

  liveScoreAddEditMatch(id) {
    const url = `/matches/id/${id}`;
    return Method.dataGet(url, localStorage.token);
  },

  liveScoreIncidentItem(incidentId) {
    const url = `/incident/id/${incidentId}`;

    return Method.dataGet(url, token);
  },

  liveScoreIncidentList(
    competitionID,
    search,
    limit,
    offset,
    sortBy,
    sortOrder,
    isParent,
    competitionOrganisationId,
  ) {
    let url = null;

    if (isParent !== true) {
      url = `/incident?entityId=${competitionOrganisationId}&entityTypeId=6&search=${search}&limit=${limit}&offset=${offset}`;
    } else {
      url = `/incident?entityId=${competitionID}&entityTypeId=1&search=${search}&limit=${limit}&offset=${offset}`;
    }
    if (sortBy && sortOrder) {
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    }
    return Method.dataGet(url, token);
  },

  // eslint-disable-next-line max-len
  liveScoreCreateMatch(
    data,
    competitionId,
    key,
    isEdit,
    team1resultId,
    team2resultId,
    matchStatus,
    endTime,
    umpireArr,
    scorerData,
    recordUmpireType,
  ) {
    let body;

    if (recordUmpireType === 'NAMES') {
      if (isEdit) {
        if (data.extraTimeType === 'FOUR_QUARTERS') {
          body = {
            id: data.id ? data.id : 0,
            startTime: data.startTime,
            divisionId: data.divisionId,
            type: data.type,
            competitionId,
            mnbMatchId: data.mnbMatchId,
            team1Id: data.team1id,
            team2Id: data.team2id,
            venueCourtId: data.venueId,
            roundId: data.roundId,
            matchDuration: data.matchDuration,
            mainBreakDuration: data.mainBreakDuration,
            breakDuration:
              data.type === 'TWO_HALVES' || data.type === 'SINGLE'
                ? data.mainBreakDuration
                : data.qtrBreak,
            team1Score: data.team1Score,
            team2Score: data.team2Score,
            resultStatus: data.resultStatus,
            team1ResultId: team1resultId,
            team2ResultId: team2resultId,
            matchStatus,
            endTime,
            matchUmpires: umpireArr,
            rosters: scorerData,
            isFinals: data.isFinals,
            extraTimeType: data.extraTimeType,
            extraTimeDuration: data.extraTimeDuration,
            extraTimeMainBreak: data.extraTimeMainBreak,
            extraTimeBreak: data.extraTimeqtrBreak,
            extraTimeWinByGoals: data.extraTimeWinByGoals,
          };
        } else {
          body = {
            id: data.id ? data.id : 0,
            startTime: data.startTime,
            divisionId: data.divisionId,
            type: data.type,
            competitionId,
            mnbMatchId: data.mnbMatchId,
            team1Id: data.team1id,
            team2Id: data.team2id,
            venueCourtId: data.venueId,
            roundId: data.roundId,
            matchDuration: data.matchDuration,
            mainBreakDuration: data.mainBreakDuration,
            breakDuration:
              data.type === 'TWO_HALVES' || data.type === 'SINGLE'
                ? data.mainBreakDuration
                : data.qtrBreak,
            team1Score: data.team1Score,
            team2Score: data.team2Score,
            resultStatus: data.resultStatus,
            team1ResultId: team1resultId,
            team2ResultId: team2resultId,
            matchStatus,
            endTime,
            matchUmpires: umpireArr,
            rosters: scorerData,
            isFinals: data.isFinals,
            extraTimeType: data.extraTimeType,
            extraTimeDuration: data.extraTimeDuration,
            extraTimeBreak: data.extraTimeMainBreak,
            extraTimeWinByGoals: data.extraTimeWinByGoals,
          };
        }
      } else if (data.extraTimeType === 'FOUR_QUARTERS') {
        body = {
          id: data.id ? data.id : 0,
          startTime: data.startTime,
          divisionId: data.divisionId,
          type: data.type,
          competitionId,
          mnbMatchId: data.mnbMatchId,
          team1Id: data.team1id,
          team2Id: data.team2id,
          venueCourtId: data.venueId,
          roundId: data.roundId,
          matchDuration: data.matchDuration,
          mainBreakDuration: data.mainBreakDuration,
          breakDuration:
            data.type === 'TWO_HALVES' || data.type === 'SINGLE'
              ? data.mainBreakDuration
              : data.qtrBreak,
          team1Score: data.team1Score,
          team2Score: data.team2Score,
          matchUmpires: umpireArr,
          rosters: scorerData,
          isFinals: data.isFinals,
          extraTimeType: data.extraTimeType,
          extraTimeDuration: data.extraTimeDuration,
          extraTimeMainBreak: data.extraTimeMainBreak,
          extraTimeBreak: data.extraTimeqtrBreak,
          extraTimeWinByGoals: data.extraTimeWinByGoals,
        };
      } else {
        body = {
          id: data.id ? data.id : 0,
          startTime: data.startTime,
          divisionId: data.divisionId,
          type: data.type,
          competitionId,
          mnbMatchId: data.mnbMatchId,
          team1Id: data.team1id,
          team2Id: data.team2id,
          venueCourtId: data.venueId,
          roundId: data.roundId,
          matchDuration: data.matchDuration,
          mainBreakDuration: data.mainBreakDuration,
          breakDuration:
            data.type === 'TWO_HALVES' || data.type === 'SINGLE'
              ? data.mainBreakDuration
              : data.qtrBreak,
          team1Score: data.team1Score,
          team2Score: data.team2Score,
          matchUmpires: umpireArr,
          rosters: scorerData,
          isFinals: data.isFinals,
          extraTimeType: data.extraTimeType,
          extraTimeDuration: data.extraTimeDuration,
          extraTimeBreak: data.extraTimeMainBreak,
          extraTimeWinByGoals: data.extraTimeWinByGoals,
        };
      }
    } else if (isEdit) {
      if (data.extraTimeType === 'FOUR_QUARTERS') {
        body = {
          id: data.id ? data.id : 0,
          startTime: data.startTime,
          divisionId: data.divisionId,
          type: data.type,
          competitionId,
          mnbMatchId: data.mnbMatchId,
          team1Id: data.team1id,
          team2Id: data.team2id,
          venueCourtId: data.venueId,
          roundId: data.roundId,
          matchDuration: data.matchDuration,
          mainBreakDuration: data.mainBreakDuration,
          breakDuration:
            data.type === 'TWO_HALVES' || data.type === 'SINGLE'
              ? data.mainBreakDuration
              : data.qtrBreak,
          team1Score: data.team1Score,
          team2Score: data.team2Score,
          resultStatus: data.resultStatus,
          team1ResultId: team1resultId,
          team2ResultId: team2resultId,
          matchStatus,
          endTime,
          rosters: umpireArr,
          // scorers: scorerData
          // breakDuration: data.breakDuration
          isFinals: data.isFinals,
          extraTimeType: data.extraTimeType,
          extraTimeDuration: data.extraTimeDuration,
          extraTimeMainBreak: data.extraTimeMainBreak,
          extraTimeBreak: data.extraTimeqtrBreak,
          extraTimeWinByGoals: data.extraTimeWinByGoals,
        };
      } else {
        body = {
          id: data.id ? data.id : 0,
          startTime: data.startTime,
          divisionId: data.divisionId,
          type: data.type,
          competitionId,
          mnbMatchId: data.mnbMatchId,
          team1Id: data.team1id,
          team2Id: data.team2id,
          venueCourtId: data.venueId,
          roundId: data.roundId,
          matchDuration: data.matchDuration,
          mainBreakDuration: data.mainBreakDuration,
          breakDuration:
            data.type === 'TWO_HALVES' || data.type === 'SINGLE'
              ? data.mainBreakDuration
              : data.qtrBreak,
          team1Score: data.team1Score,
          team2Score: data.team2Score,
          resultStatus: data.resultStatus,
          team1ResultId: team1resultId,
          team2ResultId: team2resultId,
          matchStatus,
          endTime,
          rosters: umpireArr,
          // scorers: scorerData
          // breakDuration: data.breakDuration
          isFinals: data.isFinals,
          extraTimeType: data.extraTimeType,
          extraTimeDuration: data.extraTimeDuration,
          extraTimeBreak: data.extraTimeMainBreak,
          extraTimeWinByGoals: data.extraTimeWinByGoals,
        };
      }
    } else if (data.extraTimeType === 'FOUR_QUARTERS') {
      body = {
        id: data.id ? data.id : 0,
        startTime: data.startTime,
        divisionId: data.divisionId,
        type: data.type,
        competitionId,
        mnbMatchId: data.mnbMatchId,
        team1Id: data.team1id,
        team2Id: data.team2id,
        venueCourtId: data.venueId,
        roundId: data.roundId,
        matchDuration: data.matchDuration,
        mainBreakDuration: data.mainBreakDuration,
        breakDuration:
          data.type === 'TWO_HALVES' || data.type === 'SINGLE'
            ? data.mainBreakDuration
            : data.qtrBreak,
        team1Score: data.team1Score,
        team2Score: data.team2Score,
        rosters: umpireArr,
        // scorers: scorerData
        // breakDuration: data.breakDuration
        isFinals: data.isFinals,
        extraTimeType: data.extraTimeType,
        extraTimeDuration: data.extraTimeDuration,
        extraTimeMainBreak: data.extraTimeMainBreak,
        extraTimeBreak: data.extraTimeqtrBreak,
        extraTimeWinByGoals: data.extraTimeWinByGoals,
      };
    } else {
      body = {
        id: data.id ? data.id : 0,
        startTime: data.startTime,
        divisionId: data.divisionId,
        type: data.type,
        competitionId,
        mnbMatchId: data.mnbMatchId,
        team1Id: data.team1id,
        team2Id: data.team2id,
        venueCourtId: data.venueId,
        roundId: data.roundId,
        matchDuration: data.matchDuration,
        mainBreakDuration: data.mainBreakDuration,
        breakDuration:
          data.type === 'TWO_HALVES' || data.type === 'SINGLE'
            ? data.mainBreakDuration
            : data.qtrBreak,
        team1Score: data.team1Score,
        team2Score: data.team2Score,
        rosters: umpireArr,
        // scorers: scorerData
        // breakDuration: data.breakDuration
        isFinals: data.isFinals,
        extraTimeType: data.extraTimeType,
        extraTimeDuration: data.extraTimeDuration,
        extraTimeBreak: data.extraTimeMainBreak,
        extraTimeWinByGoals: data.extraTimeWinByGoals,
      };
    }

    const url = '/matches';
    return Method.dataPost(url, token, body);
  },

  liveScoreBannerList(competitionID, organisationID) {
    // var url = `/banners?&competitionIds=${competitionID}&pageType=${1}`;
    // let competitionId = localStorage.getItem("competitionId");
    const { organisationId } = getOrganisationData() || {};
    let url = '';

    if (competitionID) {
      url = `/banners?competitionIds=${competitionID}&organisationId=${organisationId}`;
    } else if (organisationID) {
      url = `/banners?organisationId=${organisationID}`;
    }
    return Method.dataGet(url, token);
  },

  liveScoreAddBanner(
    organisationID,
    competitionID,
    bannerImage,
    // showOnHome,
    // showOnDraws,
    // showOnLadder,
    // showOnNews,
    // showOnChat,
    format,
    bannerLink,
    bannerId,
  ) {
    const body = new FormData();
    if (bannerImage !== null) {
      body.append('bannerImage', bannerImage);
    }
    body.append('organisationId', organisationID);
    body.append('competitionId', competitionID);
    body.append('id', bannerId);
    // body.append('showOnHome', showOnHome);
    // body.append('showOnDraws', showOnDraws);
    // body.append('showOnLadder', showOnLadder);
    // body.append('showOnNews', showOnNews);
    // body.append('showOnChat', showOnChat);
    body.append('format', format);
    body.append('bannerLink', bannerLink);
    const { organisationId } = getOrganisationData() || {};
    const url = `/banners?competitionId=${competitionID}&organisationId=${organisationId}`;
    return Method.dataPost(url, token, body);
  },

  liveScoreAddCommunicationBanner(
    organisationID,
    sponsorName,
    horizontalBannerImage,
    horizontalBannerLink,
    squareBannerImage,
    squareBannerLink,
    bannerId,
  ) {
    const body = new FormData();
    const types = [];
    if (horizontalBannerImage !== null) {
      body.append('images', horizontalBannerImage);
      types.push('horizontalBannerUrl');
    }
    if (squareBannerImage !== null) {
      body.append('images', squareBannerImage);
      types.push('squareBannerUrl');
    }
    body.append('imageTypes', types.toString());
    body.append('organisationId', organisationID);
    body.append('sponsorName', sponsorName);
    body.append('id', bannerId);
    body.append('horizontalBannerLink', horizontalBannerLink);
    body.append('squareBannerLink', squareBannerLink);
    // const { organisationId } = getOrganisationData() || {};
    const url = `/banners/communication?organisationId=${organisationID}`;

    return Method.dataPost(url, token, body);
  },

  liveScoreRemoveBanner(bannerId) {
    const url = `/banners/id/${bannerId}`;
    return Method.dataDelete(url, token);
  },

  liveScoreRemoveBannerImage(bannerId, type) {
    const url = `/banners/id/${bannerId}?ratioType=${
      parseInt(type, 10) === 0 ? 'horizontal' : 'square'
    }`;
    return Method.dataPost(url, token);
  },

  liveScoreNewsList(competitionId) {
    const url = `/news/admin?entityId=${competitionId}&entityTypeId=1`;
    return Method.dataGet(url, token);
  },

  liveScoreAddNews(data) {
    const body = new FormData();
    let authorData = null;

    if (JSON.parse(getLiveScoreCompetiton())) {
      authorData = JSON.parse(getLiveScoreCompetiton());
    }

    body.append('id', data.newsId ? data.newsId : 0);
    body.append('title', data.editData.title);
    body.append('body', data.editData.body);
    body.append('entityId', data.compId);
    body.append(
      'author',
      data.editData.author
        ? data.editData.author
        : authorData
        ? authorData.longName
        : 'World sport action',
    );
    body.append('recipients', data.editData.recipients);
    body.append('news_expire_date', data.editData.news_expire_date);
    body.append('recipientRefId', 12);
    body.append('entityTypeId', 1);
    body.append('toUserRoleIds', JSON.stringify(data.editData.toUserRoleIds));
    body.append('toRosterRoleIds', JSON.stringify(data.editData.toRosterRoleIds));
    body.append('toUserIds', JSON.stringify(data.editData.toUserIds));

    if (data.newsImage) {
      body.append('newsImage', data.newsImage);
    }

    if (data.newsVideo) {
      body.append('newsVideo', data.newsVideo);
    }

    if (data.mediaArry !== []) {
      for (const i in data.mediaArry) {
        body.append('newsMedia', data.mediaArry[i]);
      }
    }

    let url = null;
    url = '/news';
    return Method.dataPost(url, token, body);
  },

  liveScoreGoalList(
    compId,
    goalType,
    search,
    offset,
    limit,
    sortBy,
    sortOrder,
    isParent,
    compOrgId,
  ) {
    let url = null;
    if (isParent !== true) {
      if (goalType === 'By Match') {
        url = `/stats/scoringByPlayer?competitionId=${compId}&aggregate=MATCH&search=${search}&offset=${offset}&limit=${limit}&competitionOrganisationId=${compOrgId}`;
      } else if (goalType === 'Total') {
        url = `/stats/scoringByPlayer?competitionId=${compId}&aggregate=ALL&search=${search}&offset=${offset}&limit=${limit}&competitionOrganisationId=${compOrgId}`;
      }
    } else {
      if (goalType === 'By Match') {
        url = `/stats/scoringByPlayer?competitionId=${compId}&aggregate=MATCH&search=${search}&offset=${offset}&limit=${limit}`;
      } else if (goalType === 'Total') {
        url = `/stats/scoringByPlayer?competitionId=${compId}&aggregate=ALL&search=${search}&offset=${offset}&limit=${limit}`;
      }
    }

    if (sortBy && sortOrder) {
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    }

    return Method.dataGet(url, token);
  },

  liveScoreManagerList(roleId, entityTypeId, entityId) {
    const { id } = JSON.parse(localStorage.getItem('LiveScoreCompetition'));
    const url = `/users/byRole?roleId=${roleId}&entityTypeId=${entityTypeId}&entityId=${id}`;
    return Method.dataGet(url, token);
  },

  liveScoreScorerList(comID, roleId, body, search, sortBy, sortOrder, liveScoreCompIsParent) {
    // const competitionID = localStorage.getItem('competitionId');
    const { id, competitionOrganisation } = JSON.parse(
      localStorage.getItem('LiveScoreCompetition'),
    );
    let compOrgId = competitionOrganisation ? competitionOrganisation.id : 0;
    let url = '';
    if (!liveScoreCompIsParent) {
      url = `/roster/admin?entityTypeId=${6}&roleId=${roleId}&entityId=${compOrgId}`;
    } else {
      url = `/roster/admin?entityTypeId=${1}&roleId=${roleId}&entityId=${id}`;
    }

    if (sortBy && sortOrder) {
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    }
    return Method.dataPost(url, token, body);
  },

  bulkMatchPushBack(data, startTime, endTime, bulkRadioBtn, formatedNewDate) {
    let url = '';
    // const competitionID = localStorage.getItem('competitionId');
    const { id } = JSON.parse(localStorage.getItem('LiveScoreCompetition'));

    const extendParam = checkVenueCourtId(data);

    url = `/matches/bulk/time?startTimeStart=${startTime}&startTimeEnd=${endTime}&competitionId=${id}&type=backward`;
    if (bulkRadioBtn === 'specificTime') {
      url = `${url}&newDate=${formatedNewDate}`;
      if (extendParam) {
        url = `${url}${extendParam}`;
      }
    } else {
      const HMS = checlfixedDurationForBulkMatch(data);
      url = `${url}${HMS}`;
      if (extendParam) {
        url = `${url}${extendParam}`;
      }
    }

    return Method.dataPost(url, token);
  },

  liveScoreBringForward(competitionID, data, startDate, endDate, bulkRadioBtn, formattedNewDate) {
    let url = '';
    const { id } = JSON.parse(localStorage.getItem('LiveScoreCompetition'));
    const extendParam = checkVenueCourtId(data);

    url = `/matches/bulk/time?startTimeStart=${startDate}&startTimeEnd=${endDate}&competitionId=${id}&type=forward`;
    if (bulkRadioBtn === 'specificTime') {
      url = `${url}&newDate=${formattedNewDate}`;
      if (extendParam) {
        url = `${url}${extendParam}`;
      }
    } else {
      const HMS = checlfixedDurationForBulkMatch(data);
      url = `${url}${HMS}`;
      if (extendParam) {
        url = `${url}${extendParam}`;
      }
    }
    return Method.dataPost(url, token);
  },

  liveScoreEndMatches(data, startTime, endTime) {
    // const competitionID = localStorage.getItem('competitionId');
    const { id } = JSON.parse(localStorage.getItem('LiveScoreCompetition'));

    const extendParam = checkVenueCourtId(data);

    let url;
    if (extendParam) {
      url = `/matches/bulk/end?startTimeStart=${startTime}&startTimeEnd=${endTime}&competitionId=${id}${extendParam}`;
    } else {
      url = `/matches/bulk/end?startTimeStart=${startTime}&startTimeEnd=${endTime}&competitionId=${id}`;
    }
    return Method.dataPost(url, token);
  },

  liveScoreDoubleHeader(data) {
    // const competitionID = localStorage.getItem('competitionId');
    const { id } = JSON.parse(localStorage.getItem('LiveScoreCompetition'));
    const url = `/matches/bulk/doubleheader?competitionId=${id}&round1=${data.round_1}&round2=${data.round_2}`;
    return Method.dataPost(url, token);
  },

  liveScoreAddEditPlayer(data, playerId, playerImage) {
    // let competitionID = localStorage.getItem("competitionId");
    // let { id } = JSON.parse(localStorage.getItem('LiveScoreCompetition'))
    // let body = new FormData();
    // body.append('id', playerId ? playerId : 0)
    // body.append('firstName', data.firstName)
    // body.append('lastName', data.lastName);
    // body.append("dateOfBirth", data.dateOfBirth);
    // body.append("phoneNumber", data.phoneNumber);
    // body.append("mnbPlayerId", data.mnbPlayerId);
    // body.append("teamId", data.teamId);
    // body.append("competitionId", id)

    // if (playerImage) {
    //     body.append("photo", playerImage)
    // }
    const url = '/players';
    return Method.dataPost(url, localStorage.token, data);
  },

  liveScoreDashboard(
    competitionID,
    startDay,
    currentTime,
    competitionOrganisationId,
    liveScoreCompIsParent,
  ) {
    let url = '';
    if (!liveScoreCompIsParent) {
      url = `/dashboard/newsIncidentMatch?competitionId=${competitionID}&startDay=${startDay}&currentTime=${currentTime}&competitionOrganisationId=${competitionOrganisationId}`;
    } else {
      url = `/dashboard/newsIncidentMatch?competitionId=${competitionID}&startDay=${startDay}&currentTime=${currentTime}`;
    }
    return Method.dataGet(url, token);
  },

  async liveScoreAddEditManager(data, compOrgId, isParent) {
    const body = data;
    let url = null;
    let userId = await getUserId();
    let { id } = JSON.parse(localStorage.getItem('LiveScoreCompetition'));
    if (isParent !== true) {
      url = `/users/manager?userId=${userId}&entityId=${compOrgId}&entityTypeId=${6}&competitionId=${id}`;
    } else {
      url = `/users/manager?userId=${userId}&entityId=${id}&entityTypeId=${1}`;
    }
    return Method.dataPost(url, token, body);
  },

  // delete match
  liveScoreDeleteMatch(matchId) {
    const url = `/matches/id/${matchId}`;
    return Method.dataDelete(url, token);
  },

  // view team
  liveScoreTeamViewPlayerList(teamId) {
    const url = `/teams/id/${teamId}`;
    return Method.dataGet(url, token);
  },

  // delete team
  liveScoreDeleteTeam(teamId) {
    const url = `/teams/id/${teamId}`;
    return Method.dataDelete(url, token);
  },

  /// fetch competition venue
  liveScoreCompetitionVenue(competitionId) {
    const url = `/api/venue/competitionmgmnt${competitionId}`;
    return Method.dataGet(url, token);
  },

  // publish and notify
  liveScorePublish_Notify(data, value) {
    const body = {
      title: data.title,
      entityId: data.entityId,
      entityTypeId: data.entityTypeId,
      id: data.id,
    };
    const url = `/news/publish?id=${data.id}&silent=${value}`;
    return Method.dataGet(url, token, body);
  },

  /// delete news
  liveScoreDeleteNews(id) {
    const url = `/news/id/${id}`;
    return Method.dataDelete(url, token);
  },

  // create/edit division
  liveScoreCreateDivision(
    name,
    divisionName,
    gradeName,
    competitionId,
    divisionId,
    positionTracking,
    recordGoalAttempts,
    timeoutsData,
  ) {
    const body = {
      name,
      divisionName,
      grade: gradeName,
      competitionId,
      id: divisionId,
      positionTracking: positionTracking === 'null' ? null : positionTracking,
      recordGoalAttempts: recordGoalAttempts === 'null' ? null : recordGoalAttempts,
      timeoutDetails: timeoutsData,
    };
    const url = '/division';
    return Method.dataPost(url, token, body);
  },

  // delete division
  liveScoreDeleteDivision(divisionId) {
    const url = `/division/id/${divisionId}`;
    return Method.dataDelete(url, token);
  },
  // Delete Player
  liveScoreDeletePlayer(playerId) {
    const url = `/players/id/${playerId}`;
    return Method.dataDelete(url, token);
  },

  /// get Game Time statistics api
  gameTimeStatistics(
    competitionId,
    aggregate,
    offset,
    limit,
    searchText,
    sortBy,
    sortOrder,
    isParent,
    compOrgId,
  ) {
    const Body = {
      paging: {
        limit,
        offset,
      },
      search: searchText,
    };
    let url;
    if (!isParent) {
      if (aggregate) {
        url = `/stats/gametime?competitionId=${competitionId}&aggregate=${aggregate.toUpperCase()}&competitionOrganisationId=${compOrgId}`;
      } else {
        url = `/stats/gametime?competitionId=${competitionId}&competitionOrganisationId=${compOrgId}&aggregate=""`;
      }
    } else {
      if (aggregate) {
        url = `/stats/gametime?competitionId=${competitionId}&aggregate=${aggregate.toUpperCase()}`;
      } else {
        url = `/stats/gametime?competitionId=${competitionId}&aggregate=""`;
      }
    }

    if (sortBy && sortOrder) {
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    }
    return Method.dataPost(url, localStorage.token, Body);
  },

  /// live score match result
  liveScoreMatchResult() {
    const url = '/ref/matchResult';
    return Method.dataGet(url, localStorage.token);
  },

  /// get Game Time statistics api
  umpiresList(competitionId, body) {
    const url = `/matchUmpire/admin?competitionId=${competitionId}`;
    return Method.dataPost(url, token, body);
  },

  async liveScoreAbandonMatch(data, startTime, endTime) {
    const extendParam = checkVenueCourtId(data);
    const { id } = JSON.parse(localStorage.getItem('LiveScoreCompetition'));
    const organisationId = await getOrganisationData().organisationUniqueKey;
    let url = `/matches/bulk/end?startTimeStart=${startTime}&startTimeEnd=${endTime}&competitionId=${id}&resultTypeId=${data.resultType}&organisationUniqueKey=${organisationId}`;
    if (extendParam) {
      url = `${url}${extendParam}`;
    }
    return Method.dataPost(url, token);
  },

  liveScoreMatchImport(competitionId, csvFile) {
    const body = new FormData();
    // body.append('file', new File([csvFile], { type: 'text/csv' }));
    body.append('file', csvFile, csvFile.name);

    const { id } = JSON.parse(localStorage.getItem('LiveScoreCompetition'));
    const url = `/matches/import?competitionId=${id}`;
    return Method.dataPost(url, token, body);
  },

  getLiveScoreScorerList(comID, roleId, body) {
    // let competitionID = localStorage.getItem("competitionId");
    // let { id } = JSON.parse(localStorage.getItem('LiveScoreCompetition'))
    const url = `/roster/users?competitionId=${comID}&roleId=${roleId}`;
    return Method.dataGet(url, token, body);
  },

  liveScoreTeamImport(data) {
    const body = new FormData();
    // body.append('file', new File([data.csvFile], { type: 'text/csv' }));
    body.append('file', data.csvFile, data.csvFile.name);

    const { id } = JSON.parse(localStorage.getItem('LiveScoreCompetition'));
    const url = `/teams/import?competitionId=${id}`;
    return Method.dataPost(url, token, body);
  },

  liveScoreDivisionImport(data) {
    const body = new FormData();
    body.append('file', data.csvFile, data.csvFile.name);

    const { id } = JSON.parse(localStorage.getItem('LiveScoreCompetition'));
    const url = `/division/import?competitionId=${id}`;
    return Method.dataPost(url, token, body);
  },

  liveScoreAttendanceList(
    competitionId,
    payload,
    selectStatus,
    divisionId,
    roundId,
    isParent,
    compOrgId,
  ) {
    const body = {
      paging: payload.paging,
      search: payload.search,
    };
    let url = `/players/activity?competitionId=${competitionId}`;
    if (selectStatus === 'All') {
      // url = `/players/activity?competitionId=${competitionId}&status=${''}`;
    } else {
      url = `${url}&status=${selectStatus}`;
    }
    if (payload.sortBy && payload.sortOrder) {
      url += `&sortBy=${payload.sortBy}&sortOrder=${payload.sortOrder}`;
    }
    if (divisionId) {
      url += `&divisionId=${divisionId}`;
    }
    if (roundId) {
      url += `&roundIds=${roundId}`;
    }
    if (isParent !== true) {
      url += `&competitionOrganisationId=${compOrgId}`;
    }
    return Method.dataPost(url, token, body);
  },

  liveScoreGetTeamData(teamId) {
    const url = `/teams/id/${teamId}`;
    return Method.dataGet(url, token);
  },

  liveScorePlayerImport(competitionId, csvFile, key) {
    const body = new FormData();
    body.append('file', csvFile, csvFile.name);
    const { id, competitionOrganisation } = JSON.parse(
      localStorage.getItem('LiveScoreCompetition'),
    );
    let compOrgId = competitionOrganisation ? competitionOrganisation.id : 0;
    const url =
      key !== 'own'
        ? `/players/import?competitionOrganisationId=${compOrgId}`
        : `/players/import?competitionId=${id}`;
    return Method.dataPost(url, token, body);
  },

  liveScoreAddEditScorer(scorerData, existingScorerId, scorerRadioBtn) {
    const { id, competitionOrganisation } = JSON.parse(
      localStorage.getItem('LiveScoreCompetition'),
    );
    let compOrgId = competitionOrganisation ? competitionOrganisation.id : 0;
    let body = null;
    if (scorerRadioBtn === 'new') {
      if (scorerData.id) {
        body = {
          id: scorerData.id,
          firstName: scorerData.firstName,
          lastName: scorerData.lastName,
          mobileNumber: regexNumberExpression(scorerData.mobileNumber),
          email: scorerData.email,
        };
      } else {
        body = {
          firstName: scorerData.firstName,
          lastName: scorerData.lastName,
          mobileNumber: regexNumberExpression(scorerData.contactNo),
          email: scorerData.emailAddress,
        };
      }
    } else if (scorerRadioBtn === 'existing') {
      body = {
        id: existingScorerId,
      };
    }

    const url = `/users/member?competitionId=${id}&organisationId=${compOrgId}`;
    return Method.dataPost(url, token, body);
  },

  /// Assign Matches list
  getAssignMatchesList(competitionID, teamId, body) {
    let url;
    if (teamId) {
      url = `/matches/admin?competitionId=${competitionID}&teamId=${teamId}`;
    } else {
      url = `/matches/admin?competitionId=${competitionID}`;
    }

    return Method.dataPost(url, token, body);
  },

  // change assign status
  changeAssignStatus(roleId, records, teamID, teamKey, scorerId) {
    const body = JSON.stringify({
      matchId: records.id,
      roleId,
      teamId: records[teamKey].id,
      userId: scorerId,
    });

    const url = '/roster/admin/assign';
    // const url = `https://livescores-api-dev.worldsportaction.com/roster`;
    return Method.dataPost(url, token, body);
  },

  // Unassign status
  unAssignMatcheStatus(records) {
    const url = `/roster/admin?id=${records.rosterId}&category=Scoring`;
    return Method.dataDelete(url, token);
  },

  // Match club list
  liveScoreClubList(competitionId) {
    const url = `/linkedCompetitionOrganisation?competitionId=${competitionId}`;
    return Method.dataGet(url, token);
  },

  ladderSettingMatchResult() {
    const url = '/ref/matchResult';
    return Method.dataGet(url, token);
  },

  laddersSettingGetData(competitionId) {
    const { uniqueKey } = JSON.parse(localStorage.getItem('LiveScoreCompetition'));
    const url = `/competitions/ladderSettings?competitionId=${uniqueKey}`;
    return Method.dataGet(url, token);
  },

  laddersSettingPostData(data) {
    const { uniqueKey } = JSON.parse(localStorage.getItem('LiveScoreCompetition'));
    const body = data;

    const url = `/competitions/ladderSettings?competitionId=${uniqueKey}`;
    return Method.dataPost(url, token, body);
  },

  // Get Teams with pagination
  async getTeamWithPaging(
    competitionID,
    offset,
    limit,
    search,
    sortBy,
    sortOrder,
    competitionOrganisationId,
  ) {
    // const { organisationId } = await getOrganisationData();
    let url = null;
    if (search && search.length > 0) {
      url = `/teams/list?competitionId=${competitionID}&competitionOrganisationId=${competitionOrganisationId}&offset=${offset}&limit=${limit}&search=${search}`;
    } else {
      url = `/teams/list?competitionId=${competitionID}&competitionOrganisationId=${competitionOrganisationId}&offset=${offset}&limit=${limit}&search=${search}`;
    }

    if (sortBy && sortOrder) {
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    }

    return Method.dataGet(url, localStorage.token);
  },

  /// Get Player list with paging
  getPlayerWithPagination(
    competitionID,
    offset,
    limit,
    search,
    sortBy,
    sortOrder,
    isParent,
    competitionOrganisationId,
  ) {
    const { id, competitionOrganisation } = JSON.parse(getLiveScoreCompetiton());
    let url = null;
    let compOrgId = competitionOrganisation ? competitionOrganisation.id : 0;

    if (!isParent) {
      if (search && search.length > 0) {
        url = `/players/admin?competitionOrganisationId=${compOrgId}&offset=${offset}&limit=${limit}&search=${search}`;
      } else {
        url = `/players/admin?competitionOrganisationId=${compOrgId}&offset=${offset}&limit=${limit}&search=`;
      }
    } else {
      if (search && search.length > 0) {
        url = `/players/admin?competitionId=${competitionID}&offset=${offset}&limit=${limit}&search=${search}`;
      } else {
        url = `/players/admin?competitionId=${competitionID}&offset=${offset}&limit=${limit}&search=`;
      }
    }

    if (sortBy && sortOrder) {
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    }

    return Method.dataGet(url, localStorage.token);
  },

  /// / Export Files
  async exportFiles(url) {
    return Method.dataGetDownload(url, localStorage.token);
  },

  /// / venue Change
  venueChangeApi(competitionId, details, start, end) {
    const courtArray = JSON.stringify(details.courtId);
    const url = `/matches/bulk/courts?competitionId=${competitionId}&startTime=${start}&endTime=${end}&fromCourtIds=${courtArray}&toCourtId=${details.changeToCourtId}`;
    const body = null;
    return Method.dataPost(url, localStorage.token, body);
  },

  // Get Fixture Competition List
  getFixtureCompList(orgId) {
    const url = `/competitions/list?organisationId=${orgId}`;
    return Method.dataGet(url, localStorage.token);
  },

  liveScoreAddCoach(data, teamId, existingManagerId, compOrgId, isParent) {
    let body = data;
    let { id } = JSON.parse(localStorage.getItem('LiveScoreCompetition'));
    let url = null;
    if (isParent !== true) {
      url = `/users/coach?entityId=${compOrgId}&entityTypeId=${6}&competitionId=${id}`;
    } else {
      url = `/users/coach?entityId=${id}&entityTypeId=${1}`;
    }

    return Method.dataPost(url, token, body);
  },

  addEditUmpire(data, isUmpire, isUmpireCoach) {
    const body = data;
    const id = getUmpireCompetitionId();
    const compData = getUmpireCompetitionData() ? JSON.parse(getUmpireCompetitionData()) : null;
    const { organisationId } = getOrganisationData() || {};
    let compOrgId = compData ? compData.organisationId : null;
    let isCompParent = organisationId === compOrgId;
    let comp_Org_Id = compData
      ? compData.competitionOrganisation
        ? compData.competitionOrganisation.id
        : 0
      : 0;
    let url = '';
    if (!isCompParent) {
      //  url = `/users/umpire?competitionId=${id}&isUmpire=${isUmpire}&isUmpireCoach=${isUmpireCoach}`;
      url = `/users/umpire?entityTypeId=${6}&entityId=${comp_Org_Id}&isUmpire=${isUmpire}&isUmpireCoach=${isUmpireCoach}&competitionId=${id}`;
    } else {
      url = `/users/umpire?entityTypeId=${1}&entityId=${id}&isUmpire=${isUmpire}&isUmpireCoach=${isUmpireCoach}`;
    }
    return Method.dataPost(url, token, body);
  },

  liveScoreCoachImport(data) {
    const body = new FormData();
    // body.append('file', new File([data.csvFile], { type: 'text/csv' }));
    body.append('file', data.csvFile, data.csvFile.name);

    const { id } = JSON.parse(localStorage.getItem('LiveScoreCompetition'));
    const url = `users/importCoach?competitionId=${id}`;
    return Method.dataPost(url, token, body);
  },

  umpireRosterList(
    competitionID,
    status,
    refRoleId,
    paginationBody,
    sortBy,
    sortOrder,
    entityType,
  ) {
    let url = null;
    const body = paginationBody;

    if (status === 'All') {
      // url = `/roster/list?competitionId=${competitionID}&roleIds=${refRoleId}`;
      url = `/roster/list?entityTypeId=${entityType}&entityId=${competitionID}&roleIds=${refRoleId}`;
    } else {
      url = `/roster/list?entityTypeId=${entityType}&entityId=${competitionID}&status=${status}&roleIds=${refRoleId}`;
      // url = `/roster/list?competitionId=${competitionID}&roleIds=${refRoleId}`;
    }
    if (sortBy && sortOrder) {
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    }
    return Method.dataPost(url, token, body);
  },

  umpireRosterActionPerform(data) {
    const url = `/roster?rosterId=${data.rosterId}&status=${data.status}&category=${data.category}&callViaWeb=true`;
    return Method.dataPatch(url, token);
  },

  umpireRosterDeleteAction(data) {
    const url = `/roster?id=${data.rosterId}&category=${data.category}`;
    return Method.dataDelete(url, localStorage.token);
  },

  umpireListDashboard(data) {
    const body = data.pageData;
    let url;
    if (data.roundId) {
      const round = JSON.stringify(data.roundId);
      url = `/matchUmpire/dashboard?competitionId=${data.compId}&divisionId=${data.divisionId}&venueId=${data.venueId}&organisationId=${data.orgId}&roundIds=${round}`;
    } else {
      url = `/matchUmpire/dashboard?competitionId=${data.compId}&divisionId=${data.divisionId}&venueId=${data.venueId}&organisationId=${data.orgId}`;
    }
    if (data.sortBy && data.sortOrder) {
      url += `&sortBy=${data.sortBy}&sortOrder=${data.sortOrder}`;
    }
    // const url = `/matchUmpire/dashboard?competitionId=${1}&divisionId=${3}&venueId=${233}&organisationId=${3}`;
    return Method.dataPost(url, token, body);
  },

  umpireImport(data) {
    const body = new FormData();
    let url;
    body.append('file', data.csvFile, data.csvFile.name);

    if (data.screenName === 'umpireDashboard') {
      url = `/matchUmpire/dashboard/import?competitionId=${data.id}`;
    } else if (data.screenName === 'umpire') {
      url = `/users/import?competitionId=${data.id}&roleId=${15}`;
    } else if (data.screenName === 'liveScoreUmpireList') {
      url = `/users/import?competitionId=${data.id}&roleId=${15}`;
    }

    return Method.dataPost(url, token, body);
  },

  /// ////get all the assign umpire list on the basis of competitionId
  getAssignUmpiresList(competitionId, body, userId) {
    const url = `/matches/admin?competitionId=${competitionId}&roleId=15&userId=${userId}`;
    return Method.dataPost(url, token, body);
  },

  /// //////////assign umpire to a match
  assignUmpire(payload, rosterLocked) {
    const body = payload;
    // const url = '/roster/admin/assign';
    // const url = `/matchUmpire?matchId=${payload[0].matchId}&rosterLocked=${rosterLocked}`;
    const url = `/matchUmpire?matchId=${payload[0].matchId}`;
    return Method.dataPost(url, token, body);
  },

  /// //////unassign umpire from the match(delete)
  unassignUmpire(rosterId) {
    const url = `/roster/admin?id=${rosterId}&category=Umpiring`;
    return Method.dataDelete(url, token);
  },

  playerLineUpApi(payload) {
    const body = [
      {
        teamId: payload.teamId,
        matchId: payload.matchId,
        playing: payload.value,
        borrowed: false,
        playerId: payload.record.playerId,
        competitionId: payload.competitionId,
      },
    ];
    // body.playing = value
    const url = `/matches/lineup/update?matchId=${payload.matchId}&teamId=${payload.teamId}&updateMatchEvents=1`;
    return Method.dataPatch(url, token, body);
  },

  bulkScoreChangeApi(data) {
    const body = data;
    const url = '/matches/bulk/update';
    return Method.dataPost(url, token, body);
  },

  async liveScoreAddEditIncident(data) {
    const { body } = data;
    const players = JSON.stringify(data.playerIds);

    if (data.key === 'media') {
      const media = data.mediaArry;
      const body = new FormData();

      for (let i in media) {
        body.append('media', media[i]);
      }
      if (data.isEdit) {
        const url = `/incident/media/edit?incidentId=${data.incidentId}`;
        await Method.dataPatch(url, token, body);
      } else {
        const url = `/incident/media?incidentId=${data.incidentId}`;
        await Method.dataPost(url, token, body);
      }
    }

    if (data.isEdit) {
      const url = `/incident/edit?playerIds=${players}`;
      return Method.dataPatch(url, token, body);
    }
    const url = `/incident?playerIds=${players}`;
    return Method.dataPost(url, token, body);
  },

  liveScoreIncidentType() {
    const url = '/ref/incidentTypes';
    return Method.dataGet(url, token);
  },

  liveScoreGamePositions() {
    const url = '/ref/gamePositions';
    return Method.dataGet(url, token);
  },

  liveScoreAddEditIncidentMedia(data, incidentId) {
    const media = data.mediaArry;
    const body = new FormData();

    for (const i in media) {
      body.append('media', media[i]);
    }

    // if (data.isEdit) {
    //     if (data.incidentMediaIds.length > 0) {
    //         let incidentMediaId = JSON.stringify(data.incidentMediaIds)
    //         if (media) {
    //             const url = `/incident/media/edit?incidentId=${incidentId}&incidentMediaIds=${incidentMediaId}`;
    //             return Method.dataPatch(url, token, body)
    //         } else {
    //             const url = `/incident/media/edit?incidentId=${incidentId}&incidentMediaIds=${incidentMediaId}`;
    //             return Method.dataPatch(url, token)
    //         }
    //     } else {
    //         let incidentMediaId = JSON.stringify(data.incidentMediaIds)
    //         const url = `/incident/media/edit?incidentId=${incidentId}&incidentMediaIds=${incidentMediaId}`;
    //         return Method.dataPatch(url, token, body)
    //     }

    // } else {
    //     let incidentMediaId = JSON.stringify(data.incidentMediaIds)
    //     const url = `/incident/media?incidentId=${incidentId}&incidentMediaIds=${incidentMediaId}`;
    //     return Method.dataPost(url, token, body)
    // }
    const incidentMediaId = JSON.stringify(data.incidentMediaIds);
    if (data.isEdit) {
      const url = `/incident/media/edit?incidentId=${incidentId}&incidentMediaIds=${incidentMediaId}`;
      return Method.dataPatch(url, token, body);
    }
    const url = `/incident/media?incidentId=${incidentId}&incidentMediaIds=${incidentMediaId}`;
    return Method.dataPost(url, token, body);
  },

  liveScoreMatchSheetPrint(competitionId, divisionId, teamId, templateType, roundName) {
    const url = `/matches/print?competitionId=${competitionId}&divisionIds=${divisionId}&teamIds=${teamId}&templateType=${templateType}&roundName=${roundName}`;
    return Method.dataGet(url, token);
  },

  ladderAdjustmentPostData(data) {
    const url = '/teams/ladder/adjustment';
    return Method.dataPost(url, token, data.body);
  },

  ladderAdjustmentGetData(data) {
    const url = `/teams/ladder/adjustment?competitionUniqueKey=${data.uniqueKey}&divisionId=${data.divisionId}`;
    return Method.dataGet(url, token);
  },

  liveScoreManagerImport(data) {
    const body = new FormData();
    body.append('file', data.csvFile, data.csvFile.name);
    const url = `users/import?competitionId=${data.id}&roleId=3`;
    return Method.dataPost(url, token, body);
  },

  umpireRoundList(competitionID, divisionId) {
    let url;
    if (divisionId) {
      url = `/round?competitionId=${competitionID}&divisionId=${divisionId}`;
    } else {
      url = `/round?competitionId=${competitionID}&divisionId=${divisionId}`;
    }

    return Method.dataGet(url, localStorage.token);
  },

  innerHorizontalCompList(organisationId, yearRefId) {
    const url = `/competitions/admin?organisationId=${organisationId}&yearRefId=${yearRefId}`;

    return Method.dataPost(url, null);
  },

  liveScorePositionTrackList(data) {
    const body = data.pagination;
    let url;
    if (!data.IsParent) {
      if (data.reporting === 'PERCENT') {
        url = `/stats/positionTracking?aggregate=${
          data.aggregate
        }&reporting=${'MINUTE'}&competitionId=${data.compId}&search=${
          data.search
        }&competitionOrganisationId=${data.compOrgId}`;
      } else {
        url = `/stats/positionTracking?aggregate=${data.aggregate}&reporting=${data.reporting}&competitionId=${data.compId}&search=${data.search}&competitionOrganisationId=${data.compOrgId}`;
      }
    } else {
      if (data.reporting === 'PERCENT') {
        url = `/stats/positionTracking?aggregate=${
          data.aggregate
        }&reporting=${'MINUTE'}&competitionId=${data.compId}&search=${data.search}`;
      } else {
        url = `/stats/positionTracking?aggregate=${data.aggregate}&reporting=${data.reporting}&competitionId=${data.compId}&search=${data.search}`;
      }
    }
    if (data.sortBy && data.sortOrder) {
      url += `&sortBy=${data.sortBy}&sortOrder=${data.sortOrder}`;
    }

    return Method.dataPost(url, token, body);
  },

  liveScoreGetMainDivisionList(compId, offset, limit, sortBy, sortOrder) {
    let url;

    url = `/division?competitionId=${compId}&offset=${offset}&limit=${limit}`;

    if (sortBy && sortOrder) {
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    }

    return Method.dataGet(url, null);
  },

  /// //livescore own part competition listing
  liveScoreOwnPartCompetitionList(data, orgKey, sortBy, sortOrder, yearRefId) {
    let url = null;
    if (orgKey) {
      url = `/competitions/adminDashboard?organisationId=${orgKey}&yearRefId=${yearRefId}`;
    } else {
      url = `/competitions/adminDashboard&yearRefId=${yearRefId}`;
    }
    if (sortBy && sortOrder) {
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    }
    if (data) {
      return Method.dataPost(url, null, data);
    }
    return Method.dataPost(url, null);
  },

  liveScoreAddLiveStream(data) {
    const { body } = data;
    const url = '/matches/livestreamURL';
    return Method.dataPost(url, token, body);
  },

  resetLadderPoints(payload) {
    const url = '/teams/ladder/reset';
    return Method.dataPost(url, token, payload);
  },

  liveScoreExportGameAttendance(data) {
    const { matchId, teamId, body } = data;
    const url = `/gtattendances/manualUpload?matchId=${matchId}&teamId=${teamId}`;

    return Method.dataPost(url, token, body);
  },

  liveScoreGameAttendanceList(data) {
    const { matchId, teamId } = data;

    let url = `/gtattendances?matchId=${matchId}`;

    if (teamId) {
      url = `/gtattendances?matchId=${matchId}&teamId=${teamId}`;
    }

    return Method.dataGet(url, token);
  },

  liveScorePlayerMinuteTrackingList(data) {
    const { matchId, teamId, playerId } = data;
    let url = `/pmt?matchId=${matchId}`;
    if (teamId) {
      url += `&teamId=${teamId}`;
    }

    if (playerId) {
      url += `&playerId=${playerId}`;
    }

    return Method.dataGet(url, token);
  },

  liveScorePlayerMinuteRecord(data, matchId) {
    const url = `/pmt/record?matchId=${matchId}`;

    return Method.dataPost(url, token, data);
  },

  getUmpireActivityList(payload, roleId, userId, sortBy, sortOrder) {
    let url = `roster/umpireActivity?roleIds=${roleId}&userId=${userId}`;
    if (sortBy && sortOrder) {
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    }
    return Method.dataPost(url, token, payload);
  },

  umpirePaymentList(data) {
    const { compId, pagingBody, search, sortBy, sortOrder } = data;
    let url = null;

    if (search) {
      url = `/matchUmpire/payments?competitionId=${compId}&search=${search}`;
    } else {
      url = `/matchUmpire/payments?competitionId=${compId}`;
    }

    if (sortBy && sortOrder) {
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    }

    return Method.dataPost(url, token, pagingBody);
  },
  /// / Export Files
  umpirePaymentExport(url) {
    return Method.dataGetDownload(url, localStorage.token);
  },

  getRounds(competitionId) {
    const url = `/round?competitionId=${competitionId}`;
    return Method.dataGet(url, token);
  },

  umpirePaymentTransfer(data) {
    const { postData } = data;
    const url = `/api/payments/umpireTransfer`;
    return Method.dataPost(url, token, postData);
  },
};

const Method = {
  async dataPost(newurl, authorization, body) {
    const url = newurl;
    return await new Promise((resolve, reject) => {
      http
        .post(url, body, {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            Authorization: `BWSA ${authorization}`,
            SourceSystem: 'WebAdmin',
          },
        })
        .then(result => {
          if (result.status === 200 || result.status === 201) {
            return resolve({
              status: 1,
              result,
            });
          }
          if (result.status === 212) {
            return resolve({
              status: 4,
              result,
            });
          }
          if (result) {
            return reject({
              status: 3,
              error: result.data.message,
            });
          }
          return reject({
            status: 4,
            error: 'Something went wrong.',
          });
        })
        .catch(err => {
          if (err.response) {
            if (err.response.status !== null || err.response.status !== undefined) {
              if (err.response.status === 401) {
                const unauthorizedStatus = err.response.status;
                if (unauthorizedStatus === 401) {
                  logout();
                  message.error(ValidationConstants.messageStatus401);
                }
              } else if (err.response.status === 400) {
                message.config({
                  duration: 1.5,
                  maxCount: 1,
                });
                message.error(err.response.data.message);
                return reject({
                  status: 400,
                  error: err.response.data.message,
                });
              } else {
                return reject({
                  status: 5,
                  error: err.response && err.response.data.message,
                });
              }
            }
          } else {
            return reject({
              status: 5,
              error: err.response && err.response.data.message,
            });
          }
        });
    });
  },

  // Method to GET response
  async dataGet(newurl, authorization) {
    const url = newurl;
    return await new Promise((resolve, reject) => {
      http
        .get(url, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `BWSA ${authorization}`,
            'Access-Control-Allow-Origin': '*',
            SourceSystem: 'WebAdmin',
          },
        })
        .then(result => {
          if (result.status === 200) {
            return resolve({
              status: 1,
              result,
            });
          }
          if (result.status === 212) {
            return resolve({
              status: 4,
              result,
            });
          }
          if (result) {
            return reject({
              status: 3,
              error: result.data.message,
            });
          }
          return reject({
            status: 4,
            error: 'Something went wrong.',
          });
        })
        .catch(err => {
          if (err.response) {
            if (err.response.status !== null && err.response.status !== undefined) {
              if (err.response.status === 401) {
                const unauthorizedStatus = err.response.status;
                if (unauthorizedStatus === 401) {
                  logout();
                  message.error(ValidationConstants.messageStatus401);
                }
              } else if (err.response.status === 500) {
                message.error(err.response.data.message);
              }
            }
          } else {
            return reject({
              status: 5,
              error: err,
            });
          }
        });
    });
  },

  async dataDelete(newurl, authorization) {
    const url = newurl;
    return await new Promise((resolve, reject) => {
      http
        .delete(url, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `BWSA ${authorization}`,
            'Access-Control-Allow-Origin': '*',
            SourceSystem: 'WebAdmin',
          },
        })
        .then(result => {
          if (result.status === 200) {
            return resolve({
              status: 1,
              result,
            });
          }
          if (result.status === 212) {
            return resolve({
              status: 4,
              result,
            });
          }
          if (result) {
            return reject({
              status: 3,
              error: result.data.message,
            });
          }
          return reject({
            status: 4,
            error: 'Something went wrong.',
          });
        })
        .catch(err => {
          if (err.response) {
            if (err.response.status !== null && err.response.status !== undefined) {
              if (err.response.status === 401) {
                const unauthorizedStatus = err.response.status;
                if (unauthorizedStatus === 401) {
                  logout();
                  message.error(ValidationConstants.messageStatus401);
                }
              }
            }
          } else {
            return reject({
              status: 5,
              error: err,
            });
          }
        });
    });
  },

  async dataGetDownload(newurl, authorization) {
    const url = newurl;
    return await new Promise((resolve, reject) => {
      http
        .get(url, {
          responseType: 'arraybuffer',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/csv',
            Authorization: `BWSA ${authorization}`,
            'Access-Control-Allow-Origin': '*',
            SourceSystem: 'WebAdmin',
          },
        })
        .then(result => {
          if (result.status === 200) {
            const url = window.URL.createObjectURL(new Blob([result.data]));
            const link = document.createElement('a');
            link.href = url;
            let _now = moment().utc().format('Y-MM-DD');
            let fileName = 'filecsv';
            if (newurl.includes('payments')) {
              fileName = `umpirePayment-${_now}`;
            } else if (newurl.includes('matches')) {
              fileName = `matchDayMatches-${_now}`;
            } else if (newurl.includes('teams')) {
              fileName = `matchDayTeam-${_now}`;
            } else if (newurl.includes('exportScore')) {
              fileName = `matchDayScorerList-${_now}`;
            } else if (newurl.includes('matchUmpire')) {
              fileName = `umpireDashboard-${_now}`;
            } else if (newurl.includes('roster')) {
              fileName = `umpireRoster-${_now}`;
            }
            link.setAttribute('download', `${fileName}.csv`); // or any other extension
            document.body.appendChild(link);
            link.click();
            return resolve({
              status: 1,
              result,
            });
          }
          if (result.status === 212) {
            return resolve({
              status: 4,
              result,
            });
          }
          if (result) {
            return reject({
              status: 3,
              error: result.data.message,
            });
          }
          return reject({
            status: 4,
            error: 'Something went wrong.',
          });
        })
        .catch(err => {
          if (err.response) {
            if (err.response.status !== null && err.response.status !== undefined) {
              if (err.response.status === 401) {
                const unauthorizedStatus = err.response.status;
                if (unauthorizedStatus === 401) {
                  logout();
                  message.error(ValidationConstants.messageStatus401);
                }
              } else {
                return reject({
                  status: 5,
                  error: err,
                });
              }
            }
          } else {
            return reject({
              status: 5,
              error: err,
            });
          }
        });
    });
  },

  /// / Method to patch response
  async dataPatch(newurl, authorization, body) {
    const url = newurl;
    return await new Promise((resolve, reject) => {
      http
        .patch(url, body, {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            Authorization: `BWSA ${authorization}`,
            SourceSystem: 'WebAdmin',
          },
        })
        .then(result => {
          if (result.status === 200) {
            return resolve({
              status: 1,
              result,
            });
          }
          if (result.status === 212) {
            return resolve({
              status: 4,
              result,
            });
          }
          if (result) {
            return reject({
              status: 3,
              error: result.data.message,
            });
          }
          return reject({
            status: 4,
            error: 'Something went wrong.',
          });
        })
        .catch(err => {
          if (err.response) {
            if (err.response.status !== null || err.response.status !== undefined) {
              if (err.response.status === 401) {
                const unauthorizedStatus = err.response.status;
                if (unauthorizedStatus === 401) {
                  logout();
                  message.error(ValidationConstants.messageStatus401);
                }
              } else if (err.response.status === 400) {
                message.config({
                  duration: 1.5,
                  maxCount: 1,
                });
                message.error(err.response.data.message);
                return reject({
                  status: 400,
                  error: err.response.data.message,
                });
              } else {
                return reject({
                  status: 5,
                  error: err.response && err.response.data.message,
                });
              }
            }
          } else {
            return reject({
              status: 5,
              error: err.response && err.response.data.message,
            });
          }
        });
    });
  },
};

export default LiveScoreAxiosApi;

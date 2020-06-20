import React, { Component } from "react";
import {
    Layout,
    Breadcrumb,
    Button,
    Form,
    DatePicker,
    TimePicker,
    Select,
    InputNumber,
    Modal
} from 'antd';
import './liveScore.css';
import InnerHorizontalMenu from "../../pages/innerHorizontalMenu";
import DashboardLayout from "../../pages/dashboardLayout";
import AppConstants from "../../themes/appConstants";
import ValidationConstants from "../../themes/validationConstant";
import moment, { utc } from "moment";
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { getliveScoreDivisions } from '../../store/actions/LiveScoreAction/liveScoreActions'
import { getliveScoreTeams } from '../../store/actions/LiveScoreAction/liveScoreTeamAction'
import {
    liveScoreAddEditMatchAction,
    liveScoreAddMatchAction,
    liveScoreUpdateMatchAction,
    liveScoreCreateMatchAction,
    clearMatchAction,
    getCompetitonVenuesList,
    liveScoreClubListAction,
    searchFilterAction
} from '../../store/actions/LiveScoreAction/liveScoreMatchAction'
import { liveScoreScorerListAction } from '../../store/actions/LiveScoreAction/liveScoreScorerAction';
import InputWithHead from "../../customComponents/InputWithHead";
import { liveScoreCreateRoundAction, liveScoreRoundListAction } from '../../store/actions/LiveScoreAction/liveScoreRoundAction'
import history from "../../util/history";
import { getCompetitonId, getLiveScoreCompetiton, getUmpireCompetitonData } from '../../util/sessionStorage';
import { formateTime, liveScore_formateDate, formatDateTime } from '../../themes/dateformate'
import { getVenuesTypeAction } from "../../store/actions/appAction"
import Loader from '../../customComponents/loader'
import { getliveScoreScorerList } from '../../store/actions/LiveScoreAction/liveScoreAction';
import { isArrayNotEmpty, captializedString } from '../../util/helpers';
import { getLiveScoreDivisionList } from '../../store/actions/LiveScoreAction/liveScoreDivisionAction'
import Tooltip from 'react-png-tooltip'
import { ladderSettingGetMatchResultAction } from '../../store/actions/LiveScoreAction/liveScoreLadderSettingAction'
import { message } from "antd";
import { entityTypes } from '../../util/entityTypes'
import { refRoleTypes } from '../../util/refRoles'
import { umpireListAction } from "../../store/actions/umpireAction/umpireAction"
import { liveScoreGetMatchDetailInitiate } from "../../store/actions/LiveScoreAction/liveScoreMatchAction";

const { Footer, Content, Header } = Layout;
const { Option } = Select;


class LiveScoreAddMatch extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isEdit: this.props.location.state ? this.props.location.state.isEdit : false,
            matchId: this.props.location.state ? this.props.location.state.matchId : null,
            visible: false,
            createRound: '',
            loadvalue: false,
            loading: false,
            createMatch: false,
            key: props.location.state ? props.location.state.key ? props.location.state.key : null : null,
            roundLoad: false,
            selectedDivision: null,
            forfeitVisible: false,
            abandonVisible: false,
            umpireKey: this.props.location ? this.props.location.state ? this.props.location.state.umpireKey : null : null,
            compId: null,
            scoringType: null
        }
        this.props.clearMatchAction()
    }

    componentDidMount() {

        if (this.state.umpireKey == 'umpire') {
            const { id } = JSON.parse(getUmpireCompetitonData())
            const { scoringType } = JSON.parse(getUmpireCompetitonData())
            this.setState({ compId: id, scoringType: scoringType })
            console.log(this.state.umpireKey, 'this.state.umpireKey')

            if (id !== null) {
                this.props.getCompetitonVenuesList(id, "");
                this.props.getLiveScoreDivisionList(id)
                this.props.getliveScoreScorerList(id, 4)
                this.props.liveScoreRoundListAction(id)
                this.props.liveScoreClubListAction(id)
                this.props.umpireListAction({ refRoleId: refRoleTypes('umpire'), entityTypes: entityTypes('COMPETITION'), compId: id })
                this.setState({ loadvalue: true })
            } else {
                history.push('/')
            }

            console.log('umpireId')
        } else {
            const { id } = JSON.parse(getLiveScoreCompetiton())
            const { scoringType } = JSON.parse(getLiveScoreCompetiton())
            this.setState({ compId: id, scoringType: scoringType })

            if (id !== null) {
                this.props.getCompetitonVenuesList(id, "");
                this.props.getLiveScoreDivisionList(id)
                this.props.getliveScoreScorerList(id, 4)
                this.props.liveScoreRoundListAction(id)
                this.props.liveScoreClubListAction(id)
                this.props.umpireListAction({ refRoleId: refRoleTypes('umpire'), entityTypes: entityTypes('COMPETITION'), compId: id })
                this.setState({ loadvalue: true })
            } else {
                history.push('/')
            }
        }


        if (this.state.isEdit == true) {
            this.props.liveScoreAddEditMatchAction(this.state.matchId)
            this.props.ladderSettingGetMatchResultAction()
            this.props.liveScoreUpdateMatchAction('', "clearData")
            this.props.liveScoreGetMatchDetailInitiate(this.props.location.state.matchId)
        } else {

        }
    }

    componentDidUpdate(nextProps) {

        let { addEditMatch, start_date, start_time, displayTime } = this.props.liveScoreMatchState

        if (this.state.isEdit == true) {
            if (nextProps.liveScoreMatchState !== this.props.liveScoreMatchState) {

                if (this.props.liveScoreMatchState.matchLoad == false && this.state.loadvalue == true) {
                    // const { id } = JSON.parse(getLiveScoreCompetiton())
                    let division = this.props.liveScoreMatchState.matchData.divisionId
                    this.setInitalFiledValue(addEditMatch, start_date, start_time, displayTime)
                    this.props.getliveScoreTeams(this.state.compId, division)
                    this.setState({ loadvalue: false })

                }
            }
        }

        if (nextProps.liveScoreMatchState !== this.props.liveScoreMatchState) {
            if (this.props.liveScoreMatchState.rounLoad == false && this.state.roundLoad == true) {
                this.setState({ roundLoad: false })
                let addedRound = this.props.liveScoreMatchState.addEditMatch.roundId
                this.props.form.setFieldsValue({
                    'round': addedRound,
                })
            }
        }
    }

    ////set initial value for all validated fields
    setInitalFiledValue(data, start_date, start_time, displayTime) {
        let formated_date = moment(start_date).format("DD-MM-YYYY")
        let time_formate = moment(displayTime).format("HH:mm");

        this.props.form.setFieldsValue({
            'date': moment(start_date, "DD-MM-YYYY"),
            'time': moment(time_formate, "HH:mm"),
            'division': data.division ? data.division.name : "",
            'type': data.type,
            'home': data.team1.name,
            'away': data.team2.name,
            'round': data.roundId,
            'venue': data.venueCourtId,
            'matchDuration': data.matchDuration,
            'mainBreak': data.type == 'FOUR_QUARTERS' ? data.mainBreakDuration : data.breakDuration,
            'qtrBreak': data.breakDuration,
            'addRound': ''
        })

    }

    ////method to show modal view after click
    showModal = () => {
        this.setState({
            visible: true,
        });
    };

    ////method to hide modal view after ok click
    handleOk = e => {
        this.setState({
            visible: false,
        });
    };

    ////method to hide modal view after click on cancle button
    handleCancel = e => {
        this.setState({
            visible: false,
            createRound: ''
        });
    };


    onCreateRound = () => {
        let { addEditMatch, start_date, start_time } = this.props.liveScoreMatchState
        let sequence = 1
        // const { id } = JSON.parse(getLiveScoreCompetiton())
        let divisionID = addEditMatch.divisionId

        this.props.liveScoreCreateRoundAction(this.state.createRound, sequence, this.state.compId, divisionID)
        this.setState({ visible: false, createRound: '', roundLoad: true })
    }

    ////modal view
    ModalView(getFieldDecorator) {
        return (
            <Modal
                visible={this.state.visible}
                onOk={this.state.createRound.length == 0 ? this.handleSubmit : this.onCreateRound}
                onCancel={this.handleCancel}
                onChange={(createRound) => this.props.liveScoreUpdateMatchAction(createRound, "")}
                okButtonProps={{ style: { backgroundColor: '#ff8237', borderColor: '#ff8237' } }}
                okText={'Save'}
                centered={true}
            >
                <Form.Item>
                    {getFieldDecorator('addRound', {
                        rules: [{ required: false, message: ValidationConstants.roundField }]
                    })(
                        <InputWithHead
                            required={"required-field pb-0"}
                            heading={AppConstants.round}
                            placeholder={AppConstants.round}
                            value={this.state.createRound}
                            onChange={(e) => this.setState({ createRound: e.target.value })} />
                    )}
                </Form.Item>
            </Modal>
        )
    }

    onModalCancel() {
        this.setState({ forfeitVisible: false, abandonVisible: false })
        this.props.liveScoreUpdateMatchAction('', "clearData")
    }

    forefeitedTeamResult = () => {

        let { addEditMatch, matchData, start_date, start_time, matchResult, forfietedTeam } = this.props.liveScoreMatchState

        console.log(matchResult, 'matchResult')
        let date = new Date()
        let endMatchDate = moment(date).format("YYYY-MMM-DD")
        let endMatchTime = moment(date).format("HH:mm")
        let endMatchDateTime = moment(endMatchDate + " " + endMatchTime);
        let formatEndMatchDate = new Date(endMatchDateTime).toISOString()
        let matchStatus = 'ENDED'

        let match_date_ = moment(start_date, "DD-MM-YYYY")
        let startDate = moment(match_date_).format("YYYY-MMM-DD")
        let start = moment(start_time).format("HH:mm")


        let datetimeA = moment(startDate + " " + start);
        let formated__Date = new Date(datetimeA).toISOString()

        matchData.startTime = formated__Date

        // const { id } = JSON.parse(getLiveScoreCompetiton())


        if (forfietedTeam) {
            if (forfietedTeam == 'team1') {
                this.setState({ forfeitVisible: false })
                let team1resultId = matchResult[3].id
                let team2resultId = matchResult[4].id
                this.props.liveScoreCreateMatchAction(matchData, this.state.compId, this.state.key, this.state.isEdit, team1resultId, team2resultId, matchStatus, formatEndMatchDate, this.state.umpireKey)

            } else if (forfietedTeam == 'team2') {
                this.setState({ forfeitVisible: false })
                let team1resultId = matchResult[3].id
                let team2resultId = matchResult[4].id
                this.props.liveScoreCreateMatchAction(matchData, this.state.compId, this.state.key, this.state.isEdit, team1resultId, team2resultId, matchStatus, formatEndMatchDate, this.state.umpireKey)

            } else if (forfietedTeam == 'both') {
                this.setState({ forfeitVisible: false })
                let team1resultId = matchResult[5].id
                let team2resultId = matchResult[5].id
                this.props.liveScoreCreateMatchAction(matchData, this.state.compId, this.state.key, this.state.isEdit, team1resultId, team2resultId, matchStatus, formatEndMatchDate, this.state.umpireKey)

            }

        } else {
            message.config({
                duration: 1.5,
                maxCount: 1,
            });
            message.error(ValidationConstants.pleaseSelectTeam)
        }

    }

    ////modal view
    forfietModalView(getFieldDecorator) {
        let { addEditMatch, forfietedTeam } = this.props.liveScoreMatchState
        console.log(this.props.liveScoreMatchState, 'this.props.liveScoreMatchState~~~~')


        return (
            <Modal
                visible={this.state.forfeitVisible}
                onOk={() => this.forefeitedTeamResult()}
                // onCancel={() => this.setState({ forfeitVisible: false })}
                onCancel={() => this.onModalCancel()}
                // onChange={(createRound) => this.props.liveScoreUpdateMatchAction(createRound, "")}
                okButtonProps={{ style: { backgroundColor: '#ff8237', borderColor: '#ff8237' } }}
                okText={'Save'}
                centered={true}
            >
                <div className="col-sm" >
                    <InputWithHead required={"required-field"} heading={AppConstants.whichTeamForfieted} />

                    <Select
                        showSearch
                        style={{ width: "100%", paddingRight: 1, minWidth: 182 }}
                        onChange={(value) => this.props.liveScoreUpdateMatchAction(value, "forfietedTeam")}
                        value={forfietedTeam ? forfietedTeam : undefined}
                        placeholder={'Select Team'}
                        optionFilterProp="children"
                    >
                        <Option key={'team1'} value={'team1'} > {addEditMatch.team1.name}</Option>
                        <Option key={'team2'} value={'team2'} > {addEditMatch.team2.name}</Option>
                        <Option key={'both'} value={'both'} > {'Both'}</Option>
                    </Select>


                </div>
            </Modal>


        )
    }

    abandonReasonResult = () => {

        let { addEditMatch, matchData, start_date, start_time, matchResult, abandoneReason } = this.props.liveScoreMatchState

        console.log(matchResult, 'matchResult')
        let date = new Date()
        let endMatchDate = moment(date).format("YYYY-MMM-DD")
        let endMatchTime = moment(date).format("HH:mm")
        let endMatchDateTime = moment(endMatchDate + " " + endMatchTime);
        let formatEndMatchDate = new Date(endMatchDateTime).toISOString()
        let matchStatus = 'ENDED'

        let match_date_ = moment(start_date, "DD-MM-YYYY")
        let startDate = moment(match_date_).format("YYYY-MMM-DD")
        let start = moment(start_time).format("HH:mm")


        let datetimeA = moment(startDate + " " + start);
        let formated__Date = new Date(datetimeA).toISOString()

        matchData.startTime = formated__Date

        // const { id } = JSON.parse(getLiveScoreCompetiton())


        if (abandoneReason) {
            if (abandoneReason == 'Incomplete') {
                this.setState({ abandonVisible: false })
                let team1resultId = matchResult[7].id
                let team2resultId = matchResult[7].id
                this.props.liveScoreCreateMatchAction(matchData, this.state.compId, this.state.key, this.state.isEdit, team1resultId, team2resultId, matchStatus, formatEndMatchDate, this.state.umpireKey)

            } else if (abandoneReason == 'notPlayed') {
                this.setState({ abandonVisible: false })
                let team1resultId = matchResult[8].id
                let team2resultId = matchResult[8].id
                this.props.liveScoreCreateMatchAction(matchData, this.state.compId, this.state.key, this.state.isEdit, team1resultId, team2resultId, matchStatus, formatEndMatchDate, this.state.umpireKey)

            }

        } else {
            message.config({
                duration: 1.5,
                maxCount: 1,
            });
            message.error(ValidationConstants.selectAbandonMatchReason)
        }

    }

    abandonMatchView() {
        let { addEditMatch, abandoneReason } = this.props.liveScoreMatchState
        console.log(this.props.liveScoreMatchState, 'this.props.liveScoreMatchState~~~~')


        return (
            <Modal
                visible={this.state.abandonVisible}
                onOk={() => this.abandonReasonResult()}
                // onCancel={() => this.setState({ abandonVisible: false })}
                onCancel={() => this.onModalCancel()}
                // onChange={(createRound) => this.props.liveScoreUpdateMatchAction(createRound, "")}
                okButtonProps={{ style: { backgroundColor: '#ff8237', borderColor: '#ff8237' } }}
                okText={'Save'}
                centered={true}
            >
                <div className="col-sm" >
                    <InputWithHead required={"required-field"} heading={AppConstants.matchAbandoned} />

                    <Select
                        showSearch
                        style={{ width: "100%", paddingRight: 1, minWidth: 182 }}
                        onChange={(value) => this.props.liveScoreUpdateMatchAction(value, "abandoneReason")}
                        value={abandoneReason ? abandoneReason : undefined}
                        placeholder={'Select Reason'}
                        optionFilterProp="children"
                    >
                        <Option key={'Incomplete'} value={'Incomplete'} > {'Incomplete'}</Option>
                        <Option key={'notPlayed'} value={'notPlayed'} > {'Not Played'}</Option>
                    </Select>

                </div>
            </Modal>
        )
    }

    ///////view for breadcrumb
    headerView = () => {
        return (
            <div className="header-view">
                <Header className="form-header-view" style={{
                    backgroundColor: "transparent",
                    display: "flex",
                    alignItems: "center",

                }} >
                    <div className="row" >
                        <div className="col-sm" style={{ display: "flex", alignContent: "center" }} >
                            <Breadcrumb separator=" > ">
                                <Breadcrumb.Item className="breadcrumb-add">{this.state.isEdit == true ? AppConstants.editMatch : AppConstants.addMatch}</Breadcrumb.Item>
                            </Breadcrumb>
                        </div>
                    </div>
                </Header >
            </div>
        )
    }

    ////call api after change scorer
    onScorerChange(scorer, key) {
        let { addEditMatch } = this.props.liveScoreMatchState
        addEditMatch.scorerStatus = scorer
        this.props.liveScoreUpdateMatchAction(scorer, key)
    }

    /// Duration & Break View
    duration_break = (getFieldDecorator) => {
        let { addEditMatch } = this.props.liveScoreMatchState

        return (

            <div className="row">
                <div className="col-sm">

                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <InputWithHead required={"required-field"} heading={AppConstants.matchDuration} />
                        <Tooltip background='#ff8237'>
                            <span>{AppConstants.matchDurationMsg}</span>
                        </Tooltip>
                    </div>

                    <Form.Item>
                        {getFieldDecorator('matchDuration', {
                            rules: [{ required: true, message: ValidationConstants.durationField }]
                        })(
                            <InputNumber
                                value={addEditMatch.matchDuration}
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                onChange={(matchDuration) => this.props.liveScoreUpdateMatchAction(matchDuration, "matchDuration")}
                                placeholder={'0'}
                            />
                        )}
                    </Form.Item>
                </div>
                <div className="col-sm">

                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <InputWithHead required={"required-field"} heading={AppConstants.mainBreak} />
                        <Tooltip background='#ff8237'>
                            <span>{AppConstants.mainBreakMsg}</span>
                        </Tooltip>
                    </div>
                    <Form.Item>
                        {getFieldDecorator('mainBreak', {
                            rules: [{ required: true, message: ValidationConstants.durationField }]
                        })(
                            <InputNumber
                                value={addEditMatch.mainBreakDuration}
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                onChange={(mainBreakDuration) => this.props.liveScoreUpdateMatchAction(mainBreakDuration, "mainBreakDuration")}
                                placeholder={'0'}
                            />
                        )}
                    </Form.Item>
                </div>
                {addEditMatch.type == "FOUR_QUARTERS" && <div className="col-sm">

                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <InputWithHead required={"required-field"} heading={AppConstants.qtrBreak} />
                        <Tooltip background='#ff8237'>
                            <span>{AppConstants.qtrBreatMsg}</span>
                        </Tooltip>
                    </div>
                    <Form.Item>
                        {getFieldDecorator('qtrBreak', {
                            rules: [{ required: true, message: ValidationConstants.durationField }]
                        })(
                            <InputNumber
                                value={addEditMatch.qtrBreak}
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                onChange={(qtrBreak) => this.props.liveScoreUpdateMatchAction(qtrBreak, "qtrBreak")}
                                placeholder={'0'}
                            // onChange={onChange}
                            />
                        )}
                    </Form.Item>
                </div>}
            </div>
        );
    }

    handleSubmit = e => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {

            }
        });
    };

    selectDivision(divisionId) {
        this.props.liveScoreUpdateMatchAction(divisionId, 'divisionId')
        this.setState({ selectedDivision: divisionId })
        // const { id } = JSON.parse(getLiveScoreCompetiton())
        this.props.getliveScoreTeams(this.state.compId, divisionId)
    }

    setUmpireClub(clubId) {

        this.props.liveScoreUpdateMatchAction(clubId, 'umpireClubId')
    }

    ///// On Court Seatch
    onSearchCourts(value, key) {
        this.props.searchFilterAction(value, key)
    }
    onSearchTeams(value, key) {
        // const { id } = JSON.parse(getLiveScoreCompetiton())
        // this.props.onTeamSearch(id, this.state.selectedDivision ,value, key)
    }


    //// Form View
    contentView = (getFieldDecorator) => {
        let { addEditMatch, start_date, start_time, divisionList, roundList, teamResult, recordUmpireType, matchDetails, scorer1, scorer2, umpire1Name, umpire2Name, umpire1TextField, umpire2TextField, umpire1Orag, umpire2Orag } = this.props.liveScoreMatchState
        let { venueData, clubListData } = this.props.liveScoreMatchState
        const { scorerListResult } = this.props.liveScoreState
        // const { scoringType } = JSON.parse(getLiveScoreCompetiton())
        const { umpireList } = this.props.umpireState
        let umpireListResult = isArrayNotEmpty(umpireList) ? umpireList : []

        console.log(umpire2Orag, 'matchDetails')
        return (
            <div className="content-view pt-4">
                <div className="row" >
                    <div className="col-sm" >
                        <InputWithHead required={"required-field"} heading={AppConstants.date} />

                        <Form.Item>
                            {getFieldDecorator('date', {
                                rules: [{ required: true, message: ValidationConstants.dateField }]
                            })(
                                <DatePicker
                                    size="large"
                                    style={{ width: "100%" }}
                                    onChange={(date) => this.props.liveScoreUpdateMatchAction(date, "start_date")}
                                    format={"DD-MM-YYYY"}
                                    showTime={false}
                                    name={'registrationOepn'}
                                    placeholder='Select Date'
                                />
                            )}
                        </Form.Item>
                    </div>
                    <div className="col-sm">
                        <InputWithHead heading={AppConstants.startTime} />
                        <Form.Item>
                            {getFieldDecorator('time', {
                                rules: [{ required: true, message: ValidationConstants.dateField }]
                            })(
                                <TimePicker
                                    className="comp-venue-time-timepicker"
                                    style={{ width: "100%" }}
                                    onChange={(time) => this.props.liveScoreUpdateMatchAction(time, 'start_time')}
                                    format={"HH:mm"}
                                    placeholder='Select Time'
                                    defaultOpenValue={moment("00:00", "HH:mm")}
                                    use12Hours={false}
                                />
                            )}
                        </Form.Item>
                    </div>
                </div>

                <div className="row" >
                    <div className="col-sm" >
                        <InputWithHead required={"required-field"} heading={AppConstants.division} />
                        <Form.Item>
                            {getFieldDecorator('division', {
                                rules: [{ required: true, message: ValidationConstants.divisionField }]
                            })(
                                <Select
                                    showSearch
                                    style={{ width: "100%", paddingRight: 1, minWidth: 182 }}
                                    onChange={(divisionName) => this.selectDivision(divisionName)}
                                    value={addEditMatch.divisionId}
                                    placeholder={'Select Division'}
                                    optionFilterProp="children"
                                >
                                    {isArrayNotEmpty(divisionList) && divisionList.map((item) => (
                                        <Option key={item.id} value={item.id} > {item.name}</Option>
                                    ))
                                    }
                                </Select>
                            )}
                        </Form.Item>

                    </div>
                    <div className="col-sm">
                        <InputWithHead required={"required-field"} heading={AppConstants.type} />
                        <Form.Item>
                            {getFieldDecorator('type', {
                                rules: [{ required: true, message: ValidationConstants.typeField }]
                            })(
                                <Select
                                    loading={addEditMatch.team1 && false}
                                    style={{ width: "100%", paddingRight: 1, minWidth: 182 }}
                                    onChange={(type) => this.props.liveScoreUpdateMatchAction(type, 'type')}
                                    value={addEditMatch.type}
                                    placeholder={'Select Type'}
                                >
                                    <Option value={'SINGLE'}> Single</Option>
                                    <Option value={"TWO_HALVES"}>Halves</Option>
                                    <Option value={"FOUR_QUARTERS"}>Quarters</Option>
                                </Select>
                            )}
                        </Form.Item>
                    </div>
                </div>

                <div className="row" >
                    <div className="col-sm" >
                        <InputWithHead value={addEditMatch.competition.name} disabled={true} heading={AppConstants.competition} placeholder={AppConstants.competition} />
                    </div>
                    <div className="col-sm" >
                        <InputWithHead heading={AppConstants.matchID} />
                        <InputNumber
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '')}
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                            onChange={(mnbMatchId) => this.props.liveScoreUpdateMatchAction(mnbMatchId, "mnbMatchId")}
                            value={addEditMatch.mnbMatchId ? addEditMatch.mnbMatchId : ''}
                            placeholder={'0'}
                        />
                    </div>
                </div>
                {addEditMatch.divisionId &&
                    <div className="row" >
                        <div className="col-sm-6" >
                            <InputWithHead required={"required-field"} heading={AppConstants.homeTeam} />
                            <Form.Item>
                                {getFieldDecorator('home', {
                                    rules: [{ required: true, message: ValidationConstants.homeField }]
                                })(
                                    <Select
                                        showSearch
                                        className="reg-form-multple-select"
                                        placeholder='Select Home Team'
                                        style={{ width: "100%" }}
                                        onChange={(homeTeam) => this.props.liveScoreUpdateMatchAction(homeTeam, "team1id")}
                                        value={addEditMatch.team1Id ? addEditMatch.team1Id : ''}
                                        // onSearch={(e) => this.onSearchTeams(e, "homeTeam")}
                                        optionFilterProp="children"
                                    >
                                        {isArrayNotEmpty(teamResult) && teamResult.map((item) => (
                                            < Option value={item.id} > {item.name}</Option>
                                        ))
                                        }
                                    </Select>
                                )}
                            </Form.Item>
                        </div>
                        <div className="col-sm-6" >
                            <InputWithHead required={"required-field"} heading={AppConstants.awayTeam} />
                            <Form.Item>
                                {getFieldDecorator('away', {
                                    rules: [{ required: true, message: ValidationConstants.awayField }]
                                })(
                                    <Select
                                        showSearch
                                        onSearch={(e) => this.onSearchTeams(e, "awayTeam")}
                                        optionFilterProp="children"
                                        className="reg-form-multple-select"
                                        placeholder={'Select Away Team'}
                                        style={{ width: "100%", }}
                                        onChange={(awayTeam) => this.props.liveScoreUpdateMatchAction(awayTeam, "team2id")}
                                        value={addEditMatch.team2Id ? addEditMatch.team2Id : ''} >
                                        {isArrayNotEmpty(teamResult) && teamResult.map((item) => (
                                            < Option value={item.id} > {item.name}</Option>
                                        ))
                                        }

                                    </Select>
                                )}
                            </Form.Item>
                        </div>
                    </div>
                }

                <div className="row" >
                    <div className="col-sm-6" >
                        <InputWithHead required={"required-field"} heading={AppConstants.venue} />
                        <Form.Item>
                            {getFieldDecorator('venue', {
                                rules: [{ required: true, message: ValidationConstants.venueField }]
                            })(
                                <Select
                                    showSearch
                                    className="reg-form-multple-select"
                                    placeholder={AppConstants.selectVenue}
                                    style={{ width: "100%", }}
                                    onChange={(venueId) => this.props.liveScoreUpdateMatchAction(venueId, "venueId")}
                                    value={addEditMatch.venueCourtId}
                                    onSearch={(e) => this.onSearchCourts(e, "courts")}
                                    optionFilterProp="children"
                                >
                                    {venueData && venueData.map((item) => {
                                        return (
                                            <Option key={'venue' + item.id}
                                                value={item.venueCourtId}>
                                                {item.name}
                                            </Option>
                                        )
                                    })}

                                </Select>
                            )}
                        </Form.Item>
                    </div>
                    {
                        addEditMatch.divisionId &&
                        <div className="col-sm-6" >
                            <InputWithHead required={"required-field"} heading={AppConstants.round} />
                            <Form.Item>
                                {getFieldDecorator('round', {
                                    rules: [{ required: true, message: ValidationConstants.roundField }]
                                })(
                                    <Select
                                        //   mode="multiple"
                                        showSearch
                                        onChange={(round) => this.props.liveScoreUpdateMatchAction(round, "roundId")}
                                        placeholder={'Select Round'}
                                        style={{ width: "100%", }}
                                        value={addEditMatch.roundId ? addEditMatch.roundId : ''}
                                        optionFilterProp="children"
                                    >
                                        {isArrayNotEmpty(roundList) && roundList.map((item) => (
                                            < Option value={item.id} > {item.name}</Option>
                                        ))
                                        }
                                    </Select>
                                )}
                            </Form.Item>
                            <span style={{ cursor: 'pointer' }} onClick={() => this.showModal()} className="input-heading-add-another">
                                + {AppConstants.addNewRound}
                            </span>
                        </div>
                    }
                </div>
                {this.duration_break(getFieldDecorator)}

                {/* Umpire */}

                {
                    recordUmpireType == 'NONE' ?
                        null :
                        recordUmpireType == 'USERS' ?
                            <div>
                                <div className="row" >
                                    <div className="col-sm" >

                                        <InputWithHead
                                            heading={AppConstants.umpire1Name}
                                        />
                                        <Select
                                            style={{ width: "100%", paddingRight: 1, minWidth: 182 }}
                                            onChange={(umpire1Name) => this.props.liveScoreUpdateMatchAction(umpire1Name, 'umpire1NameSelection')}
                                            placeholder={'Select Umpire 1 Name'}
                                            value={umpire1Name ? umpire1Name : undefined}
                                        >
                                            {umpireListResult.map((item) => (
                                                <option key={item.id} value={item.id}>{item.firstName + " " + item.lastName}</option>
                                            ))}
                                        </Select>

                                    </div>
                                    <div className="col-sm" >
                                        <InputWithHead
                                            heading={AppConstants.umpire2Name}
                                        />
                                        <Select
                                            style={{ width: "100%", paddingRight: 1, minWidth: 182 }}
                                            onChange={(umpire2Name) => this.props.liveScoreUpdateMatchAction(umpire2Name, 'umpire2NameSelection')}
                                            placeholder={'Select Umpire 2 Name'}
                                            value={umpire2Name ? umpire2Name : undefined}
                                        >
                                            {umpireListResult.map((item) => (
                                                <option key={item.id} value={item.id}>{item.firstName + " " + item.lastName}</option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            :
                            recordUmpireType == 'NAMES' ?
                                <div>
                                    <div className="row" >
                                        <div className="col-sm" >

                                            <InputWithHead
                                                type='text'
                                                heading={AppConstants.umpire1Name}
                                                // onChange={(e) => { this.props.liveScoreUpdateMatchAction(captializedString(e.target.value), 'umpire1') }}
                                                // value={addEditMatch.umpire1}
                                                onChange={(e) => { this.props.liveScoreUpdateMatchAction(captializedString(e.target.value), 'umpire1TextField') }}
                                                value={umpire1TextField ? umpire1TextField : undefined}
                                                placeholder={AppConstants.enterUmpire1name} />

                                        </div>
                                        <div className="col-sm" >
                                            <InputWithHead
                                                heading={AppConstants.umpire2Name}
                                                // onChange={(e) => { this.props.liveScoreUpdateMatchAction(captializedString(e.target.value), 'umpire2') }}
                                                // value={addEditMatch.umpire2}
                                                onChange={(e) => { this.props.liveScoreUpdateMatchAction(captializedString(e.target.value), 'umpire2TextField') }}
                                                value={umpire2TextField}
                                                placeholder={AppConstants.enterUmpire2name} />
                                        </div>
                                    </div>

                                    <div className="row" >
                                        <div className="col-sm" >
                                            <InputWithHead heading={AppConstants.umpire1Club} />
                                            <Select
                                                mode='multiple'
                                                style={{ width: "100%", paddingRight: 1, minWidth: 182 }}
                                                // onChange={(umpire1Club) => this.setUmpireClub(umpire1Club)}
                                                onChange={(umpire1Orag) => { this.props.liveScoreUpdateMatchAction(umpire1Orag, 'umpire1Orag') }}
                                                value={umpire1Orag}
                                                placeholder={'Select Umpire 1 Organisation'}
                                            >

                                                {isArrayNotEmpty(clubListData) && clubListData.map((item) => (
                                                    <Option key={item.id} value={item.id} > {item.name}</Option>
                                                ))
                                                }
                                            </Select>
                                        </div>
                                        <div className="col-sm" >
                                            <InputWithHead heading={AppConstants.umpire2Club} />
                                            <Select
                                                mode='multiple'
                                                style={{ width: "100%", paddingRight: 1, minWidth: 182 }}
                                                // onChange={(umpire2Club) => this.setUmpireClub(umpire2Club)}
                                                onChange={(umpire2Orag) => { this.props.liveScoreUpdateMatchAction(umpire2Orag, 'umpire2Orag') }}
                                                value={umpire2Orag ? umpire2Orag : undefined}
                                                placeholder={'Select Umpire 2 Organisation'}
                                            >
                                                {isArrayNotEmpty(clubListData) && clubListData.map((item) => (
                                                    <option key={item.id} value={item.id}>{item.name}</option>
                                                ))}
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                :
                                null
                }


                <div className="row" >
                    <div className="col-sm-6" >
                        <InputWithHead heading={AppConstants.scorer1} />
                        <Select
                            style={{ width: "100%", paddingRight: 1, minWidth: 182 }}
                            onChange={(scorer1) => this.onScorerChange(scorer1, 'scorer1')}
                            placeholder={'Select Scorer'}
                            // value={addEditMatch.scorerStatus}
                            value={scorer1 ? scorer1 : undefined}
                        >
                            {scorerListResult.map((item) => {
                                return <Option key={'venue' + item.id} value={item.id}>
                                    {item.firstName + " " + item.lastName}
                                </Option>
                            })}
                        </Select>
                    </div>

                    {
                        this.state.scoringType !== 'SINGLE' &&
                        <div className="col-sm-6" >
                            <InputWithHead heading={AppConstants.scorer2} />
                            <Select
                                style={{ width: "100%", paddingRight: 1, minWidth: 182 }}
                                onChange={(scorer2) => this.onScorerChange(scorer2, 'scorer2')}
                                placeholder={'Select Scorer'}
                                value={scorer2 ? scorer2 : undefined}
                            >
                                {scorerListResult.map((item) => {
                                    return <Option key={'venue' + item.id} value={item.id}>
                                        {item.firstName + " " + item.lastName}
                                    </Option>
                                })}
                            </Select>
                        </div>
                    }
                </div>

                {
                    this.state.isEdit == true && <div className="row" >
                        <div className="col-sm" >
                            <InputWithHead
                                heading={AppConstants.homeTeamFinalScore}
                                placeholder={AppConstants.enterHomeTeamFinalScore}
                                onChange={(event) => this.props.liveScoreUpdateMatchAction(event.target.value, "team1Score")}
                                name={"team1Score"}
                                value={addEditMatch.team1Score}
                            />
                        </div>
                        <div className="col-sm">
                            <InputWithHead
                                heading={AppConstants.awayTeamFinalScore}
                                placeholder={AppConstants.enterAwayTeamFinalScore}
                                onChange={(event) => this.props.liveScoreUpdateMatchAction(event.target.value, "team2Score")}
                                name={"team2Score"}
                                value={addEditMatch.team2Score}
                            />
                        </div>
                    </div>


                }

                {
                    this.state.isEdit == true && <div className="row" >
                        <div className="col-sm-6" >
                            <InputWithHead heading={AppConstants.resultStatus} />
                            <Select
                                style={{ width: "100%", paddingRight: 1, minWidth: 182 }}
                                onChange={(value) => this.props.liveScoreUpdateMatchAction(value, "resultStatus")}
                                placeholder={'Select Result Status'}
                                value={addEditMatch.resultStatus ? addEditMatch.resultStatus : undefined}
                            >
                                <Option key={'UNCONFIRMED'} value={'UNCONFIRMED'}>{'Unconfirmed'}</Option>
                                <Option key={'DISPUTE'} value={'DISPUTE'}>{'Dispute'}</Option>
                                <Option key={'FINAL'} value={'FINAL'}>{'Final'}</Option>
                            </Select>
                        </div>
                    </div>


                }

            </div >
        )
    }

    endMatchResult() {

        let { addEditMatch, matchData, start_date, start_time, matchResult } = this.props.liveScoreMatchState


        let date = new Date()
        let endMatchDate = moment(date).format("YYYY-MMM-DD")
        let endMatchTime = moment(date).format("HH:mm")
        let endMatchDateTime = moment(endMatchDate + " " + endMatchTime);
        let formatEndMatchDate = new Date(endMatchDateTime).toISOString()
        let matchStatus = 'ENDED'

        let match_date_ = moment(start_date, "DD-MM-YYYY")
        let startDate = moment(match_date_).format("YYYY-MMM-DD")
        let start = moment(start_time).format("HH:mm")


        let datetimeA = moment(startDate + " " + start);
        let formated__Date = new Date(datetimeA).toISOString()

        matchData.startTime = formated__Date

        // const { id } = JSON.parse(getLiveScoreCompetiton())

        if (addEditMatch.team1ResultId > addEditMatch.team2ResultId) {
            let team1resultId = matchResult[0].id
            let team2resultId = matchResult[1].id
            this.props.liveScoreCreateMatchAction(matchData, this.state.compId, this.state.key, this.state.isEdit, team1resultId, team2resultId, matchStatus, formatEndMatchDate, this.state.umpireKey)

        } else if (addEditMatch.team1ResultId < addEditMatch.team2ResultId) {
            let team1resultId = matchResult[1].id
            let team2resultId = matchResult[0].id
            this.props.liveScoreCreateMatchAction(matchData, this.state.compId, this.state.key, this.state.isEdit, team1resultId, team2resultId, matchStatus, formatEndMatchDate, this.state.umpireKey)

        } else if (addEditMatch.team1ResultId == addEditMatch.team2ResultId) {
            let team1resultId = matchResult[2].id
            let team2resultId = matchResult[2].id
            this.props.liveScoreCreateMatchAction(matchData, this.state.compId, this.state.key, this.state.isEdit, team1resultId, team2resultId, matchStatus, formatEndMatchDate, this.state.umpireKey)

        }

    }

    ////create match post method
    addMatchDetails = (e) => {

        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                let { addEditMatch, matchData, start_date, start_time, start_post_date, umpire1Orag, umpire1TextField, umpire2Orag, umpire2TextField, umpire1Name, umpire2Name, scorer1, scorer2, recordUmpireType } = this.props.liveScoreMatchState

                let match_date_ = moment(start_date, "DD-MM-YYYY")
                let startDate = moment(match_date_).format("YYYY-MMM-DD")
                let start = moment(start_time).format("HH:mm")


                let datetimeA = moment(startDate + " " + start);
                let formated__Date = new Date(datetimeA).toISOString()

                matchData.startTime = formated__Date

                let umpireData

                let scorers_1 = {
                    matchId: this.state.matchId,
                    teamId: addEditMatch.team1Id,
                    userId: scorer1,
                    roleId: 4,
                }

                let scorers_2 = {
                    matchId: this.state.matchId,
                    teamId: addEditMatch.team2Id,
                    userId: scorer2,
                    roleId: 4,
                }

                let scorerData = [scorers_1, scorers_2]

                if (recordUmpireType == 'NAMES') {
                    let umpire_1_Obj = {
                        matchId: this.state.matchId,
                        organisationId: umpire1Orag,
                        umpireName: umpire1TextField,
                        umpireType: recordUmpireType,
                        sequence: 1
                    }

                    let umpire_2_Obj = {
                        matchId: this.state.matchId,
                        organisationId: umpire2Orag,
                        umpireName: umpire2TextField,
                        umpireType: recordUmpireType,
                        sequence: 2
                    }


                    umpireData = [umpire_1_Obj, umpire_2_Obj]

                } else if (recordUmpireType == 'USERS') {
                    let umpire_1_Obj = {
                        matchId: this.state.matchId,
                        userId: umpire1Name,
                        roleId: 4
                    }

                    let umpire_2_Obj = {
                        matchId: this.state.matchId,
                        userId: umpire2Name,
                        roleId: 4
                    }
                    umpireData = [umpire_1_Obj, umpire_2_Obj]
                }

                // const { id } = JSON.parse(getLiveScoreCompetiton())
                this.props.liveScoreCreateMatchAction(matchData, this.state.compId, this.state.key, this.state.isEdit, null, null, null, null, this.state.umpireKey, umpireData, scorerData)
            }
        });
    }


    //////footer view containing all the buttons like save and cancel
    footerView = (isSubmitting) => {

        // return (
        //     <div className="fluid-width">
        //         <div className="footer-view">
        //             <div className="row">
        //                 <div className="col-sm">

        //                         <div className="col-sm live-score-edit-match-buttons">
        //                             <Button onClick={() => history.push(this.state.key == 'dashboard' ? 'liveScoreDashboard' : '/liveScoreMatches')} type="cancel-button">{AppConstants.cancel}</Button>
        //                         </div>
        //                         {this.state.isEdit == true && <div className="col-sm">

        //                                 <div className="col-sm live-score-edit-match-buttons">
        //                                     <Button type="cancel-button">{AppConstants.forfiet}</Button>
        //                                 </div>
        //                                 <div className="col-sm live-score-edit-match-buttons">
        //                                     <Button type="cancel-button">{AppConstants.abandon}</Button>
        //                                 </div>
        //                                 <div className="col-sm live-score-edit-match-buttons">
        //                                     <Button type="cancel-button">{AppConstants.endMatch}</Button>
        //                                 </div>
        //                         </div>}

        //                 </div>

        //                 <div className="col-sm-1">
        //                     <div className="comp-buttons-view">
        //                         <Button
        //                             className="user-approval-button" type="primary" htmlType="submit" >
        //                             {AppConstants.save}
        //                         </Button>
        //                     </div>
        //                 </div>
        //             </div>
        //         </div>
        //     </div >
        // );

        return (
            <div className="fluid-width">
                {!this.state.membershipIsUsed &&
                    <div className="footer-view">
                        <div className="row">
                            <div className="col-sm">
                                <div className="reg-add-save-button">
                                    <Button onClick={() => history.push(this.state.key == 'dashboard' ? 'liveScoreDashboard' : this.state.key == 'umpireRoaster' ? 'umpireRoaster' : this.state.umpireKey == 'umpire' ? 'umpireDashboard' : '/liveScoreMatches')} type="cancel-button">{AppConstants.cancel}</Button>
                                    {this.state.isEdit == true && <Button onClick={() => this.setState({ forfeitVisible: true })} className="ml-3" type="cancel-button">{AppConstants.forfiet}</Button>}
                                    {this.state.isEdit == true && <Button onClick={() => this.setState({ abandonVisible: true })} className="ml-3" type="cancel-button">{AppConstants.abandon}</Button>}
                                    {this.state.isEdit == true && <Button onClick={() => this.endMatchResult()} className="ml-3" type="cancel-button">{AppConstants.endMatch}</Button>}
                                </div>
                            </div>
                            <div className="col-sm">
                                <div className="comp-buttons-view">
                                    <Button
                                        className="user-approval-button" type="primary" htmlType="submit" >
                                        {AppConstants.save}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            </div>
        )
    };


    /////// render function
    render() {
        const { getFieldDecorator } = this.props.form
        return (
            <div className="fluid-width" style={{ backgroundColor: "#f7fafc" }} >
                {
                    this.state.umpireKey ?
                        <DashboardLayout menuHeading={AppConstants.umpires} menuName={AppConstants.umpires} />
                        :
                        <DashboardLayout menuHeading={AppConstants.liveScores} menuName={AppConstants.liveScores} onMenuHeadingClick={() => history.push("./liveScoreCompetitions")} />
                }

                {
                    this.state.umpireKey ?
                        <InnerHorizontalMenu menu={"umpire"} umpireSelectedKey={"1"} />
                        :
                        <InnerHorizontalMenu menu={"liveScore"} liveScoreSelectedKey={this.state.key == 'dashboard' ? '1' : "2"} />
                }
                <Loader visible={this.props.liveScoreMatchState.onLoad} />
                <Layout>
                    {this.headerView()}

                    <Form
                        autoComplete='off'
                        onSubmit={this.addMatchDetails} className="login-form">
                        <Content>
                            <div className="formView">
                                {this.contentView(getFieldDecorator)}
                                {this.ModalView(getFieldDecorator)}
                                {this.forfietModalView(getFieldDecorator)}
                                {this.abandonMatchView()}
                            </div>
                        </Content>
                        <Footer>
                            {this.footerView()}
                        </Footer>
                    </Form>

                </Layout>
            </div>
        );
    }
}
function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getliveScoreDivisions,
        getliveScoreTeams,
        liveScoreAddEditMatchAction,
        liveScoreAddMatchAction,
        liveScoreUpdateMatchAction,
        liveScoreCreateMatchAction,
        liveScoreCreateRoundAction,
        getVenuesTypeAction,
        liveScoreScorerListAction,
        clearMatchAction,
        getCompetitonVenuesList,
        getliveScoreScorerList,
        getLiveScoreDivisionList,
        liveScoreRoundListAction,
        liveScoreClubListAction,
        searchFilterAction,
        ladderSettingGetMatchResultAction,
        umpireListAction,
        liveScoreGetMatchDetailInitiate

    }, dispatch)
}

function mapStatetoProps(state) {
    return {
        liveScoreState: state.LiveScoreState,
        liveScoreMatchState: state.LiveScoreMatchState,
        liveScoreScorerState: state.LiveScoreScorerState,
        liveScoreTeamState: state.LiveScoreTeamState,
        umpireState: state.UmpireState,
    }
}
export default connect(mapStatetoProps, mapDispatchToProps)(Form.create()(LiveScoreAddMatch));
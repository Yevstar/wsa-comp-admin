import React, { Component } from "react";
import {
    Layout, Table, Select, Menu, Pagination, Button, DatePicker, Tag, Input, Modal
} from "antd";
import "./product.scss";
import { NavLink } from "react-router-dom";
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { getOrganisationData, getGlobalYear, setGlobalYear } from "util/sessionStorage";
import { getAffiliateToOrganisationAction } from "store/actions/userAction/userAction";
import { isEmptyArray } from "formik";
import moment from "moment";
import { SearchOutlined } from "@ant-design/icons";
import Loader from "customComponents/loader";
import InnerHorizontalMenu from "../../pages/innerHorizontalMenu";
import DashboardLayout from "../../pages/dashboardLayout";
import AppConstants from "../../themes/appConstants";
import AppImages from "../../themes/appImages";
import {
    getOnlyYearListAction,
    getFeeTypeAction,
    getPaymentOptionsListAction,
    getPaymentMethodsListAction,
    getDiscountMethodListAction
} from "../../store/actions/appAction";
import { currencyFormat } from "../../util/currencyFormat";
import { getPaymentList, exportPaymentDashboardApi, setDashboardPageSizeAction, partialRefundAmountAction, setDashboardPageNumberAction } from "../../store/actions/stripeAction/stripeAction";
import { endUserRegDashboardListAction } from "../../store/actions/registrationAction/endUserRegistrationAction";
import InputWithHead from "../../customComponents/InputWithHead";

const { Content } = Layout;
const { Option } = Select;
const { SubMenu } = Menu;
let this_Obj = null;

// listeners for sorting
const listeners = (key) => ({
    onClick: () => tableSort(key),
});

/// //function to sort table column
function tableSort(key) {
    let sortBy = key;
    let sortOrder = null;
    if (this_Obj.state.sortBy !== key) {
        sortOrder = 'ASC';
    } else if (this_Obj.state.sortBy === key && this_Obj.state.sortOrder === 'ASC') {
        sortOrder = 'DESC';
    } else if (this_Obj.state.sortBy === key && this_Obj.state.sortOrder === 'DESC') {
        sortBy = sortOrder = null;
    }

    this_Obj.setState({ sortBy, sortOrder });
    this_Obj.props.getPaymentList(this_Obj.state.offset, sortBy, sortOrder, -1, "-1", this_Obj.state.yearRefId, this_Obj.state.competitionUniqueKey, this_Obj.state.filterOrganisation, this_Obj.state.dateFrom, this_Obj.state.dateTo, this_Obj.state.searchText);
}

const columns = [
    {
        title: AppConstants.name,
        dataIndex: "userFirstName",
        key: "userFirstName",
        sorter: true,
        onHeaderCell: ({ dataIndex }) => listeners("name"),
        render: (userFirstName, record) => (
            <NavLink
                to={{
                    pathname: `/userPersonal`,
                    state: {
                        userId: record.userId,
                        screenKey: "paymentDashboard",
                        screen: "/paymentDashboard",
                    },
                }}
            >
                <span className="input-heading-add-another pt-0">{`${record.userFirstName} ${record.userLastName}`}</span>
            </NavLink>
        ),
    },
    {
        title: AppConstants.paidBy,
        dataIndex: "paidBy",
        key: "paidBy",
        sorter: true,
        onHeaderCell: ({ dataIndex }) => listeners(dataIndex),
    },
    {
        title: AppConstants.organisation,
        dataIndex: "affiliateName",
        key: "affiliateName",
        sorter: true,
        onHeaderCell: ({ dataIndex }) => listeners("affiliate"),
        render: (affiliateName) => (
            <span>{affiliateName === null || affiliateName === "" ? "N/A" : affiliateName}</span>
        ),
    },
    {
        title: AppConstants.competition,
        dataIndex: "competitionName",
        key: "competitionName",
        sorter: true,
        onHeaderCell: ({ dataIndex }) => listeners("competition"),
        render: (competitionName) => (
            <span>{competitionName}</span>
        ),
    },
    {
        title: AppConstants.feeType,
        dataIndex: "feeType",
        key: "feeType",
        sorter: true,
        onHeaderCell: ({ dataIndex }) => listeners(dataIndex),
    },
    {
        title: AppConstants.paymentType,
        dataIndex: "paymentType",
        key: "paymentType",
        sorter: true,
        onHeaderCell: ({ dataIndex }) => listeners(dataIndex),
    },
    {
        title: AppConstants.membershipType,
        dataIndex: "membershipTypeName",
        key: "membershipTypeName",
        sorter: true,
        onHeaderCell: ({ dataIndex }) => listeners(dataIndex),
    },
    {
        title: AppConstants.totalFeeIncGst,
        dataIndex: "invoiceTotal",
        key: "invoiceTotal",
        render: (invoiceTotal, record) => currencyFormat(invoiceTotal),
        sorter: true,
        onHeaderCell: ({ dataIndex }) => listeners("totalFee"),
    },
    {
        title: AppConstants.feePaid,
        dataIndex: "paidFee",
        key: "paidFee",
        render: (paidFee, record) => currencyFormat(paidFee),
        sorter: true,
        onHeaderCell: ({ dataIndex }) => listeners("paidFee"),
    },
    {
        title: AppConstants.portion,
        dataIndex: "affiliatePortion",
        key: "affiliatePortion",
        render: (affiliatePortion, record) => (
            affiliatePortion < 0
                ? <span style={{ color: "red" }}>{`(${currencyFormat(affiliatePortion * -1)})`}</span>
                : <span>{currencyFormat(affiliatePortion)}</span>
        ),
        sorter: true,
        onHeaderCell: ({ dataIndex }) => listeners("ourPortion"),
    },
    {
        title: AppConstants.discount,
        dataIndex: "discount",
        key: "discount",
        render: (discount, record) => currencyFormat(discount),
        sorter: true,
        onHeaderCell: ({ dataIndex }) => listeners("discount"),
    },
    {
        title: AppConstants.governmentVoucher,
        dataIndex: "governmentVoucherAmount",
        key: "governmentVoucherAmount",
        render: (governmentVoucherAmount, record) => {
            return (
                <div className={(record.governmentVoucherStatusRefId != 2 && parseFloat(governmentVoucherAmount) > 0) && "government-voucher-grey-text"}>
                    {currencyFormat(governmentVoucherAmount)}
                </div>
            )
        },
        sorter: true,
        onHeaderCell: ({ dataIndex }) => listeners("governmentVoucherAmount"),
    },
    {
        title: AppConstants.status,
        dataIndex: "paymentStatus",
        key: "paymentStatus",
        sorter: true,
        onHeaderCell: ({ dataIndex }) => listeners("status"),
        render: (paymentStatus) => (
            // <span>{paymentStatus === "pending" ? "Not Paid" : "Paid"}</span>
            <span>{paymentStatus}</span>
        ),
    },
    {
        title: AppConstants.action,
        dataIndex: "isUsed",
        key: "isUsed",
        render: (isUsed, record) => {
            return(
                <div>
                    {(record.affiliatePortion > 0 && record.paymentType != "Invoice") ?
                        <Menu
                            className="action-triple-dot-submenu "
                            theme="light"
                            mode="horizontal"
                            style={{ lineHeight: "25px" }}
                        >
                            <SubMenu
                                key="sub1"
                                style={{ borderBottomStyle: "solid", borderBottom: 0 }}
                                title={(
                                    <img
                                        className="dot-image"
                                        src={AppImages.moreTripleDot}
                                        alt=""
                                        width="16"
                                        height="16"
                                    />
                                )}
                            >
                                {/* <Menu.Item key="1">
                                    <span>{AppConstants.redeemVoucher}</span>
                                </Menu.Item>
                                <Menu.Item key="2">
                                    <span>{AppConstants.cashPaymentReceived}</span>
                                </Menu.Item> */}
                                <Menu.Item key="3" onClick={() =>this_Obj.refundPopUp(record)}>
                                    <span>{AppConstants.partialRefund}</span>
                                </Menu.Item>
    
                            </SubMenu>
                        </Menu>
                        :
                        null
                    }
                    
                </div>
            )
            
        },
    },
];

class PaymentDashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            organisationUniqueKey: getOrganisationData() ? getOrganisationData().organisationUniqueKey : null,
            deleteLoading: false,
            yearRefId: null,
            competitionUniqueKey: "-1",
            filterOrganisation: -1,
            loadingSave: false,
            offset: 0,
            userInfo: null,
            userId: -1,
            registrationId: "-1",
            sortBy: null,
            sortOrder: null,
            dateFrom: null,
            dateTo: null,
            type: -1,
            feeType: -1,
            paymentOption: -1,
            paymentMethod: -1,
            status: -1,
            searchText: '',
            membershipType: -1,
            paymentStatus: -1,
            showRefundModalVisible: false,
            refundRecord: null,
            refundAmount: null,
            showMaximumAmountPopup: false,
            showValidAmountVisible: false,
            discountMethod: -1,
        };
        this_Obj = this;
    }

    async componentDidMount() {
        const { paymentDashboardListAction } = this.props.paymentState;
        this.referenceCalls(this.state.organisationUniqueKey);
        let page = 1;
        let { sortBy } = this.state;
        let { sortOrder } = this.state;
        if (paymentDashboardListAction) {
            const { offset } = paymentDashboardListAction;
            sortBy = paymentDashboardListAction.sortBy;
            sortOrder = paymentDashboardListAction.sortOrder;
            const registrationId = paymentDashboardListAction.registrationId == null ? '-1' : paymentDashboardListAction.registrationId;
            const userId = paymentDashboardListAction.userId == null ? -1 : paymentDashboardListAction.userId;
            const yearRefId = getGlobalYear() ? getGlobalYear() : paymentDashboardListAction.yearId;
            const competitionUniqueKey = paymentDashboardListAction.competitionKey;
            const { dateFrom } = paymentDashboardListAction;
            const { dateTo } = paymentDashboardListAction;
            const filterOrganisation = paymentDashboardListAction.paymentFor;

            await this.setState({
                offset, sortBy, sortOrder, registrationId, userId, yearRefId: JSON.parse(yearRefId), competitionUniqueKey, dateFrom, dateTo, filterOrganisation,
            });
            let { paymentListPageSize } = this.props.paymentState;
            paymentListPageSize = paymentListPageSize ? paymentListPageSize : 10;
            page = Math.floor(offset / paymentListPageSize) + 1;

            this.handlePaymentTableList(page, userId, registrationId, this.state.searchText);
        } else {
            const yearRefId = getGlobalYear() ? getGlobalYear() : '-1';
            const userInfo = this.props.location.state ? this.props.location.state.personal : null;
            const registrationId = this.props.location.state ? this.props.location.state.registrationId : null;
            this.setState({ userInfo, registrationId, yearRefId: JSON.parse(yearRefId) });
            const userId = userInfo != null ? userInfo.userId : -1;
            const regId = registrationId != null ? registrationId : '-1';

            this.handlePaymentTableList(1, userId, regId, this.state.searchText);
        }
    }

    componentDidUpdate() {
        if(this.state.onLoad == true && this.props.paymentState.refundAmountLoad == false && 
                this.props.paymentState.status == 1){
            this.handlePaymentTableList(1, this.state.userId, this.state.regId, this.state.searchText);
            this.setState({onLoad: false})
        }
    }

    referenceCalls = (organisationId) => {
        this.props.getAffiliateToOrganisationAction(organisationId);
        this.props.getOnlyYearListAction();
        this.props.getFeeTypeAction();
        this.props.getPaymentOptionsListAction();
        this.props.getPaymentMethodsListAction();
        this.props.getDiscountMethodListAction();
        this.props.endUserRegDashboardListAction({
            organisationUniqueKey: this.state.organisationUniqueKey,
            yearRefId: 1,
            competitionUniqueKey: '-1',
            dobFrom: '-1',
            dobTo: '-1',
            membershipProductTypeId: -1,
            genderRefId: -1,
            postalCode: '-1',
            affiliate: -1,
            membershipProductId: -1,
            paymentId: -1,
            paymentStatusRefId: -1,
            searchText: '',
            teamId: -1,
            regFrom: '-1',
            regTo: '-1',
            paging: {
                limit: 10,
                offset: 0,
            },
        }, null, null);
    };

    onExport() {
        const {
            sortBy,
            sortOrder,
            // yearRefId,
            competitionUniqueKey,
            filterOrganisation,
            dateFrom,
            dateTo,
            searchText,
            feeType,
            paymentOption,
            paymentMethod,
            membershipType,
            offset,
            discountMethod,
        } = this.state;
        const year = getGlobalYear() ? getGlobalYear() : '-1';

        this.props.exportPaymentDashboardApi(
            offset,
            sortBy,
            sortOrder,
            this.state.userId !== null ? this.state.userId : -1,
            "-1",
            this.state.yearRefId == -1 ? this.state.yearRefId : JSON.parse(year),
            competitionUniqueKey,
            filterOrganisation,
            dateFrom,
            dateTo,
            searchText,
            feeType,
            paymentOption,
            paymentMethod,
            membershipType,
            discountMethod,
        );
    }

    clearFilterByUserId = () => {
        this.setState({ userInfo: null });
        this.handlePaymentTableList(this.state.offset, -1, "-1", this.state.searchText);
    }

    // on change search text
    onChangeSearchText = (e) => {
        this.setState({ searchText: e.target.value, offset: 0 });
        if (e.target.value === null || e.target.value === "") {
            this.handlePaymentTableList(
                1,
                this.state.userId !== null ? this.state.userId : -1,
                this.state.registrationId !== null ? this.state.registrationId : "-1",
                e.target.value,
                this.state.feeType,
                this.state.paymentOption,
                this.state.paymentMethod,
                this.state.membershipType,
                this.state.discountMethod,
            );
        }
    }

    onKeyEnterSearchText = (e) => {
        const code = e.keyCode || e.which;
        if (code === 13) { // 13 is the enter keycode
            this.handlePaymentTableList(
                1,
                this.state.userId !== null ? this.state.userId : -1,
                this.state.registrationId !== null ? this.state.registrationId : "-1",
                this.state.searchText,
                this.state.feeType,
                this.state.paymentType,
                this.state.paymentMethod,
                this.state.discountMethod,
            );
        }
    };

    onClickSearchIcon = () => {
        if (this.state.searchText) {
            this.handlePaymentTableList(
                1,
                this.state.userId !== null ? this.state.userId : -1,
                this.state.registrationId !== null ? this.state.registrationId : "-1",
                this.state.searchText,
                this.state.feeType,
                this.state.paymentType,
                this.state.paymentMethod,
                this.state.discountMethod,
            );
        }
    };

    refundPopUp = (record) => {
        this.setState({showRefundModalVisible: true, refundRecord: record})
    }

    refundAmountCall = () => {
        let amount = Number(this.state.refundAmount);
        let affiliatePortion = Number(this.state.refundRecord.affiliatePortion)
        if(amount <= 0){
            this.setState({showRefundModalVisible:false, refundAmount:null, showValidAmountVisible: true})
        }
        else if(amount <= affiliatePortion){
            let payload = {
                transactionId: this.state.refundRecord.transactionId,
                amount: amount
            }
            this.props.partialRefundAmountAction(payload);
            this.setState({showRefundModalVisible:false, refundAmount:null, onLoad: true})
        }
        else{
            this.setState({showMaximumAmountPopup : true, showRefundModalVisible:false, refundAmount:null})
        }
    }

    validAmountPopup = () => {
        return(
            <Modal
                title={AppConstants.warning}
                visible={this.state.showValidAmountVisible}
                cancelButtonProps={{ style: { display: 'none' } }}
                onCancel={() =>this.setState({showValidAmountVisible: false})}
                onOk={() =>this.setState({showValidAmountVisible: false})}
            >
            {AppConstants.enterValidAmount}
            </Modal>
        )
    }

    maximumAmountPopup = () => {
        return(
            <Modal
                title={AppConstants.warning}
                visible={this.state.showMaximumAmountPopup}
                cancelButtonProps={{ style: { display: 'none' } }}
                onCancel={() =>this.setState({showMaximumAmountPopup: false})}
                onOk={() =>this.setState({showMaximumAmountPopup: false})}
            >
            {AppConstants.maximumAmountPopupTxt}
            </Modal>
        )

    }

    refundAmountModalPopUp = () => {
        return (
            <Modal
                title={AppConstants.partialRefund}
                visible={this.state.showRefundModalVisible}
                onCancel={() =>this.setState({showRefundModalVisible: false, refundRecord: null})}
                onOk={() => this.refundAmountCall()}
            >
                <InputWithHead
                style={{width: "30%"}}
                value={this.state.refundAmount} 
                onChange={(e) => this.setState({refundAmount: e.target.value})}
                heading={AppConstants.enterRefundAmount}
                placeholder={AppConstants.enterAmount}
                />
            </Modal>
        );
    }


    headerView = () => {
        const tagName = this.state.userInfo != null ? `${this.state.userInfo.firstName} ${this.state.userInfo.lastName}` : null;
        return (
            <div className="comp-player-grades-header-drop-down-view">
                <div className="fluid-width">
                    <div className="row">
                        <div className="col-sm d-flex align-content-center">
                            <span className="form-heading">
                                {AppConstants.dashboard}
                            </span>
                        </div>
                        <div className="col-sm-8 w-100 d-flex flex-row align-items-center justify-content-end">
                            <div className="row">
                                {this.state.userInfo && (
                                    <div className="col-sm pt-1 align-self-center">
                                        <Tag
                                            closable
                                            color="volcano"
                                            style={{ paddingTop: 3, height: 30 }}
                                            onClose={() => { this.clearFilterByUserId(); }}
                                        >
                                            {tagName}
                                        </Tag>
                                    </div>
                                )}

                                <div className="pt-1 d-flex justify-content-end">
                                    <div className="comp-product-search-inp-width">
                                        <Input
                                            className="product-reg-search-input"
                                            onChange={this.onChangeSearchText}
                                            placeholder="Search..."
                                            onKeyPress={this.onKeyEnterSearchText}
                                            value={this.state.searchText}
                                            prefix={(
                                                <SearchOutlined
                                                    style={{ color: "rgba(0,0,0,.25)", height: 16, width: 16 }}
                                                    onClick={this.onClickSearchIcon}
                                                />
                                            )}
                                            allowClear
                                        />
                                    </div>
                                </div>

                                <div className="col-sm pt-1">
                                    <div className="comp-dashboard-botton-view-mobile w-100 d-flex flex-row align-items-center justify-content-end">
                                        <Button
                                            onClick={() => this.onExport()}
                                            className="primary-add-comp-form"
                                            type="primary"
                                        >
                                            <div className="row">
                                                <div className="col-sm">
                                                    <img
                                                        src={AppImages.export}
                                                        alt=""
                                                        className="export-image"
                                                    />
                                                    {AppConstants.export}
                                                </div>
                                            </div>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    handleShowSizeChange = async (page, pageSize) => {
        await this.props.setDashboardPageSizeAction(pageSize);
        const { userId, registrationId, searchText } = this.state;
        this.handlePaymentTableList(page, userId, registrationId, searchText);
    }

    handlePaymentTableList = async (page, userId, regId, searchValue) => {
        await this.props.setDashboardPageNumberAction(page);
        let { paymentListPageSize } = this.props.paymentState;
        paymentListPageSize = paymentListPageSize ? paymentListPageSize : 10;

        const {
            sortBy,
            sortOrder,
            // yearRefId,
            competitionUniqueKey,
            filterOrganisation,
            dateFrom,
            dateTo,
            // searchText,
            feeType,
            paymentOption,
            paymentMethod,
            membershipType,
            paymentStatus,
            discountMethod
        } = this.state
        let offset = page ? paymentListPageSize * (page - 1) : 0;
        let year = getGlobalYear() ? getGlobalYear() : '-1'
        this.setState({
            offset,
            userId,
            registrationId: regId,
        });
        // this.props.getPaymentList(offset, sortBy, sortOrder, userId, "-1", yearRefId, competitionUniqueKey, filterOrganisation, dateFrom, dateTo, searchValue);
        this.props.getPaymentList(
            offset,
            paymentListPageSize,
            sortBy,
            sortOrder,
            userId,
            "-1",
            this.state.yearRefId == -1 ? this.state.yearRefId : JSON.parse(year),
            competitionUniqueKey,
            filterOrganisation,
            dateFrom,
            dateTo,
            searchValue,
            feeType,
            paymentOption,
            paymentMethod,
            membershipType,
            paymentStatus,
            discountMethod
        );
    };

    onChangeDropDownValue = async (value, key) => {
        if (key === "yearRefId") {
            await this.setState({ yearRefId: value });
            if (value != -1) {
                setGlobalYear(value);
            }
            this.handlePaymentTableList(
                1,
                -1,
                null,
                this.state.searchText,
            );
        } else if (key === "competitionId") {
            await this.setState({ competitionUniqueKey: value });
            this.handlePaymentTableList(
                1,
                -1,
                null,
                this.state.searchText,
            );
        } else if (key === "filterOrganisation") {
            await this.setState({ filterOrganisation: value });
            this.handlePaymentTableList(
                1,
                -1,
                "-1",
                this.state.searchText,
            );
        } else if (key === "dateFrom") {
            await this.setState({ dateFrom: value ? moment(value).startOf('day').format('YYYY-MM-DD HH:mm:ss') : value });
            this.handlePaymentTableList(
                1,
                -1,
                "-1",
                this.state.searchText,
            );
        } else if (key === "dateTo") {
            await this.setState({ dateTo: value ? moment(value).endOf('day').format('YYYY-MM-DD HH:mm:ss') : value });
            this.handlePaymentTableList(
                1,
                -1,
                "-1",
                this.state.searchText,
            );
        } else if (key === "feeType") {
            await this.setState({ feeType: value });
            this.handlePaymentTableList(
                1,
                -1,
                "-1",
                this.state.searchText,
            );
        } else if (key === "paymentOption") {
            await this.setState({ paymentOption: value });
            this.handlePaymentTableList(
                1,
                -1,
                "-1",
                this.state.searchText,
            );
        } else if (key === "paymentMethod") {
            await this.setState({ paymentMethod: value });
            this.handlePaymentTableList(
                1,
                -1,
                "-1",
                this.state.searchText,
            );
        } else if (key === "membershipType") {
            await this.setState({ membershipType: value });
            this.handlePaymentTableList(
                1,
                -1,
                "-1",
                this.state.searchText,
            );
        } else if (key == "paymentStatus") {
            await this.setState({ paymentStatus: value });
            this.handlePaymentTableList(
                1,
                -1,
                "-1",
                this.state.searchText
            );
        } else if (key="discountMethod") {
            await this.setState({ discountMethod: value });
            this.handlePaymentTableList(
                1,
                -1,
                "-1",
                this.state.searchText
            );
        }
    };

    dropdownView_1 = () => {
        const affiliateToData = this.props.userState.affiliateTo;
        let uniqueValues = [];
        // const paymentStatus = [
        //     { id: 1, description: AppConstants.pendingMembership },
        //     { id: 2, description: AppConstants.pendingRegistrationFee },
        //     { id: 3, description: AppConstants.registered },
        // ];

        if (affiliateToData.affiliatedTo !== undefined) {
            const obj = {
                organisationId: getOrganisationData() ? getOrganisationData().organisationUniqueKey : null,
                name: getOrganisationData() ? getOrganisationData().name : null,
            };
            uniqueValues.push(obj);
            const arr = [...new Map(affiliateToData.affiliatedTo.map((obj) => [obj.organisationId, obj])).values()];
            if (isEmptyArray) {
                uniqueValues = [...uniqueValues, ...arr];
            }
        }
        const { paymentCompetitionList } = this.props.paymentState;
        return (
            <div>
                <div className="row pb-5">
                    <div className="col-sm">
                        <InputWithHead required="pt-0" heading={AppConstants.year} />
                        <Select
                            className="reg-payment-select w-100"
                            style={{
                                paddingRight: 1, minWidth: 160, maxHeight: 60, minHeight: 44,
                            }}
                            onChange={(yearRefId) => this.onChangeDropDownValue(yearRefId, "yearRefId")}
                            value={this.state.yearRefId}
                        >
                            <Option key={-1} value={-1}>{AppConstants.all}</Option>
                            {this.props.appState.yearList.map((item) => (
                                <Option key={`year_${item.id}`} value={item.id}>
                                    {item.description}
                                </Option>
                            ))}
                        </Select>
                    </div>
                    <div className="col-sm">
                        <InputWithHead required="pt-0" heading={AppConstants.competition} />
                        <Select
                            showSearch
                            optionFilterProp="children"
                            className="reg-payment-select w-100"
                            style={{ paddingRight: 1, minWidth: 160 }}
                            onChange={(competitionId) => this.onChangeDropDownValue(competitionId, "competitionId")}
                            value={this.state.competitionUniqueKey}
                        >
                            <Option key={-1} value="-1">{AppConstants.all}</Option>
                            {(paymentCompetitionList || []).map((item) => (
                                <Option
                                    // key={'competition_' + item.competitionUniquekey}
                                    key={item.competitionUniquekey}
                                    value={item.competitionUniqueKey}
                                >
                                    {item.competitionName}
                                </Option>
                            ))}
                        </Select>
                    </div>
                    <div className="col-sm">
                        <InputWithHead required="pt-0" heading={AppConstants.paymentFor} />
                        <Select
                            showSearch
                            optionFilterProp="children"
                            className="reg-payment-select w-100"
                            style={{ paddingRight: 1, minWidth: 160 }}
                            onChange={(e) => this.onChangeDropDownValue(e, "filterOrganisation")}
                            value={this.state.filterOrganisation}
                        >
                            <Option key={-1} value={-1}>{AppConstants.all}</Option>
                            {(uniqueValues || []).map((org) => (
                                <Option key={`organisation_${org.organisationId}`} value={org.organisationId}>
                                    {org.name}
                                </Option>
                            ))}
                        </Select>
                    </div>
                    <div className="col-sm">
                        <InputWithHead required="pt-0" heading={AppConstants.dateFrom} />
                        <DatePicker
                            className="reg-payment-datepicker w-100"
                            size="default"
                            style={{ minWidth: 160 }}
                            format="DD-MM-YYYY"
                            showTime={false}
                            placeholder="dd-mm-yyyy"
                            onChange={(e) => this.onChangeDropDownValue(e, "dateFrom")}
                            value={this.state.dateFrom !== null && moment(this.state.dateFrom, "YYYY-MM-DD")}
                        />
                    </div>
                    <div className="col-sm">
                        <InputWithHead required="pt-0" heading={AppConstants.dateTo} />
                        <DatePicker
                            className="reg-payment-datepicker w-100"
                            size="default"
                            style={{ minWidth: 160 }}
                            format="DD-MM-YYYY"
                            showTime={false}
                            placeholder="dd-mm-yyyy"
                            onChange={(e) => this.onChangeDropDownValue(e, "dateTo")}
                            value={this.state.dateTo !== null && moment(this.state.dateTo, "YYYY-MM-DD")}
                        />
                    </div>
                </div>
                <div className="row pb-5">
                    <div className="col-sm-3">
                        <InputWithHead required="pt-0" heading={AppConstants.type} />
                        <Select
                            showSearch
                            optionFilterProp="children"
                            className="reg-payment-select w-100"
                            style={{ paddingRight: 1, minWidth: 160 }}
                            onChange={(type) => this.setState({ type })}
                            value={this.state.type}
                        >
                            <Option key={-1} value={-1}>{AppConstants.all}</Option>
                            <Option key="playerRegistration" value="playerRegistration">{AppConstants.playerRegistration}</Option>
                            <Option key="coachRegistration" value="coachRegistration">{AppConstants.coachRegistration}</Option>
                            <Option key="teamRegistration" value="teamRegistration">{AppConstants.teamRegistration}</Option>
                            <Option key="shop" value="shop">{AppConstants.shop}</Option>
                            <Option key="umpire" value="umpire">{AppConstants.umpire}</Option>
                        </Select>
                    </div>
                    <div className="col-sm-3">
                        <InputWithHead required="pt-0" heading={AppConstants.status} />
                        <Select
                            showSearch
                            optionFilterProp="children"
                            className="reg-payment-select w-100"
                            style={{ paddingRight: 1, minWidth: 160 }}
                            onChange={(status) => this.setState({ status })}
                            value={this.state.status}
                        >
                            <Option key={-1} value={-1}>{AppConstants.all}</Option>
                            <Option key="paid" value="paid">{AppConstants.paid}</Option>
                            <Option key="pending" value="pending">{AppConstants.pending}</Option>
                            <Option key="declined" value="declined">{AppConstants.declined}</Option>
                        </Select>
                    </div>
                </div>
            </div>
        );
    }

    dropdownView = () => {
        const affiliateToData = this.props.userState.affiliateTo;
        let uniqueValues = [];
        // const paymentStatus = [
        //     { id: 1, description: AppConstants.pendingMembership },
        //     { id: 2, description: AppConstants.pendingRegistrationFee },
        //     { id: 3, description: AppConstants.registered },
        // ];

        if (affiliateToData.affiliatedTo !== undefined) {
            const obj = {
                organisationId: getOrganisationData() ? getOrganisationData().organisationUniqueKey : null,
                name: getOrganisationData() ? getOrganisationData().name : null,
            };
            uniqueValues.push(obj);
            const arr = [...new Map(affiliateToData.affiliatedTo.map((obj) => [obj.organisationId, obj])).values()];
            if (isEmptyArray) {
                uniqueValues = [...uniqueValues, ...arr];
            }
        }
        const { paymentCompetitionList } = this.props.paymentState;
        return (
            <div>
                <div className="row pb-2">
                    <div className="col-sm-3">
                        <InputWithHead required="pt-0" heading={AppConstants.year} />
                        <Select
                            className="reg-payment-select w-100"
                            style={{
                                paddingRight: 1, minWidth: 160, maxHeight: 60, minHeight: 44,
                            }}
                            onChange={(yearRefId) => this.onChangeDropDownValue(yearRefId, "yearRefId")}
                            value={this.state.yearRefId}
                        >
                            <Option key={-1} value={-1}>{AppConstants.all}</Option>
                            {this.props.appState.yearList.map((item) => (
                                <Option key={`year_${item.id}`} value={item.id}>
                                    {item.description}
                                </Option>
                            ))}
                        </Select>
                    </div>
                    <div className="col-sm-3">
                        <InputWithHead required="pt-0" heading={AppConstants.competition} />
                        <Select
                            showSearch
                            optionFilterProp="children"
                            className="reg-payment-select w-100"
                            style={{ paddingRight: 1, minWidth: 160 }}
                            onChange={(competitionId) => this.onChangeDropDownValue(competitionId, "competitionId")}
                            value={this.state.competitionUniqueKey}
                        >
                            <Option key={-1} value="-1">{AppConstants.all}</Option>
                            {(paymentCompetitionList || []).map((item) => (
                                <Option
                                    // key={'competition_' + item.competitionUniquekey}
                                    key={item.competitionUniquekey}
                                    value={item.competitionUniqueKey}
                                >
                                    {item.competitionName}
                                </Option>
                            ))}
                        </Select>
                    </div>
                    <div className="col-sm-3">
                        <InputWithHead required="pt-0" heading={AppConstants.paymentFor} />
                        <Select
                            showSearch
                            optionFilterProp="children"
                            className="reg-payment-select w-100"
                            style={{ paddingRight: 1, minWidth: 160 }}
                            onChange={(e) => this.onChangeDropDownValue(e, "filterOrganisation")}
                            value={this.state.filterOrganisation}
                        >
                            <Option key={-1} value={-1}>{AppConstants.all}</Option>
                            {(uniqueValues || []).map((org) => (
                                <Option key={`organisation_${org.organisationId}`} value={org.organisationId}>
                                    {org.name}
                                </Option>
                            ))}
                        </Select>
                    </div>
                    <div className="col-sm-3 pt-2">
                        <InputWithHead required="pt-0" heading={AppConstants.status} />
                        <Select
                            showSearch
                            optionFilterProp="children"
                            className="reg-payment-select w-100"
                            style={{ paddingRight: 1, minWidth: 160 }}
                            onChange={(status) => this.onChangeDropDownValue(status, "paymentStatus")}
                            value={this.state.paymentStatus}
                        >
                            <Option key={-1} value={-1}>{AppConstants.all}</Option>
                            <Option key="paid" value={2}>{AppConstants.paid}</Option>
                            <Option key="pending" value={1}>{AppConstants.pending}</Option>
                            <Option key="declined" value={6}>{AppConstants.declined}</Option>
                        </Select>
                    </div>
                </div>

                <div className="row pb-2">
                    <div className="col-sm-3">
                        <InputWithHead required="pt-0" heading={AppConstants.feeType} />
                        <Select
                            showSearch
                            optionFilterProp="children"
                            className="reg-payment-select w-100"
                            style={{ paddingRight: 1, minWidth: 160 }}
                            onChange={(feeType) => this.onChangeDropDownValue(feeType, "feeType")}
                            value={this.state.feeType}
                        >
                            <Option key={-1} value={-1}>{AppConstants.all}</Option>
                            {this.props.appState.feeTypes.map((feeType) => (
                                <Option key={`feeType_${feeType.id}`} value={feeType.id}>
                                    {feeType.description}
                                </Option>
                            ))}
                        </Select>
                    </div>
                    <div className="col-sm-3">
                        <InputWithHead required="pt-0" heading={AppConstants.paymentType} />
                        <Select
                            showSearch
                            optionFilterProp="children"
                            className="reg-payment-select w-100"
                            style={{ paddingRight: 1, minWidth: 160 }}
                            onChange={(paymentOption) => this.onChangeDropDownValue(paymentOption, "paymentOption")}
                            value={this.state.paymentOption}
                        >
                            <Option key={-1} value={-1}>{AppConstants.all}</Option>
                            {this.props.appState.paymentOptions.map((paymentOption) => (
                                <Option key={`paymentOption_${paymentOption.id}`} value={paymentOption.id}>
                                    {paymentOption.description}
                                </Option>
                            ))}
                        </Select>
                    </div>
                    <div className="col-sm-3">
                        <InputWithHead required="pt-0" heading={AppConstants.paymentMethod} />
                        <Select
                            showSearch
                            optionFilterProp="children"
                            className="reg-payment-select w-100"
                            style={{ paddingRight: 1, minWidth: 160 }}
                            onChange={(paymentMethod) => this.onChangeDropDownValue(paymentMethod, "paymentMethod")}
                            value={this.state.paymentMethod}
                        >
                            <Option key={-1} value={-1}>{AppConstants.all}</Option>
                            {this.props.appState.paymentMethods.map((paymentMethod) => (
                                <Option key={`paymentMethod_${paymentMethod.id}`} value={paymentMethod.name}>
                                    {paymentMethod.description}
                                </Option>
                            ))}
                        </Select>
                    </div>
                    <div className="col-sm-3">
                        <InputWithHead required="pt-0" heading={AppConstants.membershipTYpe} />
                        <Select
                            showSearch
                            optionFilterProp="children"
                            className="reg-payment-select w-100"
                            style={{ paddingRight: 1, minWidth: 160 }}
                            onChange={(membershipType) => this.onChangeDropDownValue(membershipType, "membershipType")}
                            value={this.state.membershipType}
                        >
                            <Option key={-1} value={-1}>{AppConstants.all}</Option>
                            {this.props.userRegistrationState.membershipProductTypes.map((mt) => (
                                <Option key={`mt_${mt.id}`} value={mt.membershipProductTypeId}>
                                    {mt.membershipProductTypeName}
                                </Option>
                            ))}
                        </Select>
                    </div>
                </div>

                <div className="row pb-5">
                    <div className="col-sm-3 pt-2">
                        <InputWithHead required="pt-0" heading={AppConstants.discount} />
                        <Select
                            showSearch
                            optionFilterProp="children"
                            className="reg-payment-select w-100"
                            style={{ paddingRight: 1, minWidth: 160 }}
                            onChange={(discountMethod) => this.onChangeDropDownValue(discountMethod, "discountMethod")}
                            value={this.state.discountMethod}
                        >
                            <Option key={-1} value={-1}>{AppConstants.all}</Option>
                            {this.props.appState.discountMethod.map((discountMethod) => (
                                <Option key={`discountMethod_${discountMethod.id}`} value={discountMethod.id}>
                                    {discountMethod.description}
                                </Option>
                            ))}
                        </Select>
                    </div>
                    <div className="col-sm-3 pt-2">
                        <InputWithHead required="pt-0" heading={AppConstants.dateFrom} />
                        <DatePicker
                            className="reg-payment-datepicker w-100"
                            size="default"
                            style={{ minWidth: 160 }}
                            format="DD-MM-YYYY"
                            showTime={false}
                            placeholder="dd-mm-yyyy"
                            onChange={(e) => this.onChangeDropDownValue(e, "dateFrom")}
                            value={this.state.dateFrom !== null && moment(this.state.dateFrom, "YYYY-MM-DD")}
                        />
                    </div>
                    <div className="col-sm-3 pt-2">
                        <InputWithHead required="pt-0" heading={AppConstants.dateTo} />
                        <DatePicker
                            className="reg-payment-datepicker w-100"
                            size="default"
                            style={{ minWidth: 160 }}
                            format="DD-MM-YYYY"
                            showTime={false}
                            placeholder="dd-mm-yyyy"
                            onChange={(e) => this.onChangeDropDownValue(e, "dateTo")}
                            value={this.state.dateTo !== null && moment(this.state.dateTo, "YYYY-MM-DD")}
                        />
                    </div>
                </div>
            </div>
        );
    }

    contentView = () => {
        const userId = this.state.userInfo != null ? this.state.userInfo.userId : -1;
        const regId = this.state.registrationId != null ? this.state.registrationId : '-1';
        const { paymentListTotalCount, paymentListData, paymentListPage, onLoad, paymentListPageSize } = this.props.paymentState;
        return (
            <div className="comp-dash-table-view mt-2">
                {this.dropdownView()}
                <div className="table-responsive home-dash-table-view">
                    <Table
                        className="home-dashboard-table"
                        columns={columns}
                        dataSource={paymentListData}
                        pagination={false}
                        loading={onLoad && true}
                    />
                </div>
                <div className="d-flex justify-content-end">
                    <Pagination
                        className="antd-pagination"
                        showSizeChanger
                        total={paymentListTotalCount}
                        current={paymentListPage}
                        defaultCurrent={paymentListPage}
                        defaultPageSize={paymentListPageSize}
                        onChange={(page) => this.handlePaymentTableList(page, userId, regId, this.state.searchText)}
                        onShowSizeChange={this.handleShowSizeChange}
                    />
                </div>
            </div>
        );
    };

    render() {
        return (
            <div className="fluid-width default-bg">
                <DashboardLayout
                    menuHeading={AppConstants.finance}
                    menuName={AppConstants.finance}
                />
                <InnerHorizontalMenu menu="finance" finSelectedKey="1" />
                <Loader visible={this.props.paymentState.onExportLoad} />
                <Layout>
                    {this.headerView()}
                    <Content>
                        {this.contentView()}
                    </Content>
                    {this.refundAmountModalPopUp()}
                    {this.maximumAmountPopup()}
                    {this.validAmountPopup()}
                </Layout>
            </div>
        );
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getOnlyYearListAction,
        getFeeTypeAction,
        getPaymentOptionsListAction,
        getPaymentMethodsListAction,
        getPaymentList,
        exportPaymentDashboardApi,
        getAffiliateToOrganisationAction,
        endUserRegDashboardListAction,
        setDashboardPageSizeAction,
        setDashboardPageNumberAction,
        partialRefundAmountAction,
        getDiscountMethodListAction
    }, dispatch);
}

function mapStateToProps(state) {
    return {
        paymentState: state.StripeState,
        appState: state.AppState,
        userState: state.UserState,
        userRegistrationState: state.EndUserRegistrationState,
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(PaymentDashboard);

/*
  This component is responsible for creating verusQR invoices and
  showing the user their receiving address. If the user ever wants
  to receive coins from anyone, they should be able to go to this
  screen and configure their invoice within a few button presses.
*/

import React, { Component, useState } from "react"
import StandardButton from "../../../components/StandardButton"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  Keyboard,
  Clipboard,
  Alert,
  RefreshControl
 } from "react-native"
import { Input,ButtonGroup, Button } from 'react-native-elements'
import { connect } from 'react-redux'
import { Dropdown } from 'react-native-material-dropdown'
import Styles from '../../../styles/index'
import QRModal from '../../../components/QRModal'
import { coinsToSats, isNumber, truncateDecimal } from '../../../utils/math'
import Colors from '../../../globals/colors';
import { conditionallyUpdateWallet } from "../../../actions/actionDispatchers"
import { API_GET_FIATPRICE, API_GET_BALANCES, GENERAL, USD, ELECTRUM, DLIGHT } from "../../../utils/constants/intervalConstants"
import { expireData } from "../../../actions/actionCreators"
import Store from "../../../store"
import SwitchButton from "switch-button-react-native"

class ReceiveCoin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedCoin: this.props.activeCoin,
      private: false,
      amount: 0,
      address: null,
      memo: null,
      errors: {selectedCoin: null, amount: null, address: null, memo: null },
      verusQRString: null,
      amountFiat: false,
      loading: false,
      showModal: false,
      privateIndex: 0,
      privateAddress: null
    };
  }

  componentDidMount() {
    this.setAddress()
    const {
      state,
      props,
      validateFormData,
      forceUpdate,
      switchInvoiceCoin,
      copyAddressToClipboard
    } = this;
    const { activeCoinsForUser, rates, displayCurrency } = props;
    const {
      loading,
      showModal,
      verusQRString,
      selectedCoin,
      address,
      errors,
      amountFiat
    } = state;

    console.log(JSON.stringify(address))
  }

  setAddress = () => {
    let index = 0;
    const activeUser = this.props.activeAccount
    const coinObj = this.state.selectedCoin

    if (
      activeUser.keys[coinObj.id] != null &&
      activeUser.keys[coinObj.id].electrum != null &&
      activeUser.keys[coinObj.id].electrum.addresses.length > 0
    ) {
      this.setState({
        address: activeUser.keys[coinObj.id].electrum.addresses[0]
      });
    } else {
      throw new Error(
        "ReceiveCoin.js: Fatal mismatch error, " +
          activeUser.id +
          " user keys for active coin " +
          coinObj[i].id +
          " not found!"
      );
    }
    this.activeUserDlight();

    //if checkt of het een private coin, of er een address bestaat, kijk naar hoe we dat doen bij de b

  }

/*
1) maak een button met 2 keuzes zoals in de graphic
2) maak een private boolean (true false varibale) in states
3)pas dat component aan om als je true valse varibale true is
je private address uit redux haalt ipv je public

*/
//this if statement is here because it can turn the switch on or off
walletPrivate = () => {
  if (
     this.state.private === true
   ) {
     this.setState({
       private: false
     });
  } else {

  this.setState({
    private: true
  });
  this.activeUserDlight();
}
}



//this is a function just like the "setAddress" but then for the private addresses
  activeUserDlight = () => {
    let index = 0;
    const activeUser = this.props.activeAccount
    const coinObj = this.state.selectedCoin

    if (
      activeUser.keys[coinObj.id] != null &&
      activeUser.keys[coinObj.id].dlight != null &&
      activeUser.keys[coinObj.id].dlight.addresses.length > 0
    ) {
      this.setState({
        privateAddress: activeUser.keys[coinObj.id].dlight.addresses[0]
      });
    } else {
      throw new Error(
        "ReceiveCoin.js: Fatal mismatch error, " +
          activeUser.id +
          " user keys for active coin " +
          coinObj[i].id +
          " not found!"
      );
    }
  }

  _handleSubmit = () => {
    Keyboard.dismiss();
    this.validateFormData()
  }

  handleError = (error, field) => {
    let _errors = this.state.errors
    _errors[field] = error

    this.setState({errors: _errors})
  }

  forceUpdate = () => {
    const coinObj = this.props.activeCoin
    this.props.dispatch(expireData(coinObj.id, API_GET_FIATPRICE))
    this.props.dispatch(expireData(coinObj.id, API_GET_BALANCES))

    this.refresh()
  }

  refresh = () => {
    this.setState({ loading: true }, () => {
      const updates = [API_GET_FIATPRICE, API_GET_BALANCES]
      Promise.all(updates.map(async (update) => {
        await conditionallyUpdateWallet(Store.getState(), this.props.dispatch, this.props.activeCoin.id, update)
      })).then(res => {
        this.setState({ loading: false })
      })
      .catch(error => {
        this.setState({ loading: false })
        console.warn(error)
      })
    })
  }


  updateProps = (promiseArray) => {
    return new Promise((resolve, reject) => {
      Promise.all(promiseArray)
        .then((updatesArray) => {
          if (updatesArray.length > 0) {
            for (let i = 0; i < updatesArray.length; i++) {
              if(updatesArray[i]) {
                this.props.dispatch(updatesArray[i])
              }
            }
            if (this.state.loading) {
              this.setState({ loading: false });
            }
            resolve(true)
          }
          else {
            resolve(false)
          }
        })
    })
  }

  createQRString = (coinTicker, amount, address, memo) => {
    const { rates, displayCurrency } = this.props

    let _price = rates[coinTicker] != null ? rates[coinTicker][displayCurrency] : null

    let verusQRJSON = {
      verusQR: global.VERUS_QR_VERSION,
      coinTicker: coinTicker,
      address: address,
      amount: this.state.amountFiat ? truncateDecimal(coinsToSats(amount/_price), 0) : coinsToSats(amount),
      memo: memo
    }

    this.setState({verusQRString: JSON.stringify(verusQRJSON), showModal: true})
  }

  switchInvoiceCoin = (coinObj) => {
    this.setState({selectedCoin: coinObj},
      () => {
        this.setAddress()
      })
  }

//this is a function that saperates the private and non-private addresses
  switchInvoiceAddress = (coinObj) => {
    this.setState({selectedAddress: coinObj})
  }



  switchInvoiceAddressPrivate = (coinObj) => {
    this.setState({ privateAddress: coinObj})
  }
  copyAddressToClipboard = () => {
    Clipboard.setString(this.state.address);
    Alert.alert("Address Copied", "Address copied to clipboard")
  }

  getPrice = () => {
    const { state, props } = this
    const { amount, selectedCoin, amountFiat } = state
    const { rates, displayCurrency } = props

    let _price = rates[selectedCoin.id] != null ? rates[selectedCoin.id][displayCurrency] : null

    if (!(amount.toString()) ||
      !(isNumber(amount)) ||
      !_price) {
      return 0
    }

    if (amountFiat) {
      return truncateDecimal(amount/_price, 8)
    } else {
      return truncateDecimal(amount*_price, 2)
    }
  }

  validateFormData = () => {
    this.setState({
      errors: {selectedCoin: null, amount: null, address: null, memo: null },
      verusQRString: null
    }, () => {
      const _selectedCoin = this.state.selectedCoin
      const _amount = this.state.amount
      const _address = this.state.address
      const _memo = this.state.memo
      const privateIndex = this.state.privateIndex;
      let _errors = false;

      if (!_selectedCoin) {
        Alert.alert("Error", "Please select a coin to receive.")
        _errors = true
      }

      if (!(_amount.toString()) || _amount.toString().length < 1) {
        this.handleError("Required field", "amount")
        _errors = true
      } else if (!(isNumber(_amount))) {
        this.handleError("Invalid amount", "amount")
        _errors = true
      } else if (Number(_amount) <= 0) {
        this.handleError("Enter an amount greater than 0", "amount")
        _errors = true
      }

      if (!_errors) {
        this.createQRString(_selectedCoin.id, _amount, _address, _memo)
      } else {
        return false;
      }
    });
  }

  renderBalanceLabel = () => {
    const { activeCoin, balances } = this.props

    if (balances.errors.public) {
      return (
        <Text
          style={{ ...Styles.largeCentralPaddedHeader, ...Styles.errorText }}
        >
      //    {CONNECTION_ERROR}
        </Text>
      );
    } else if (balances.public) {
      return (
        <Text style={Styles.largeCentralPaddedHeader}>
          {truncateDecimal(balances.public.confirmed, 4) +
            " " +
            activeCoin.id}
        </Text>
      );
    } else {
      return null;
    }
  };

  changeIndex = (privateIndex) => {
    this.setState({ privateIndex })
  }
  pubText = () => <Text style={{...Styles.fullWidthButtonTitle, color: Colors.secondaryColor}}>PUBLIC</Text>

  privText = () =>  <Text style={{...Styles.fullWidthButtonTitle, color: Colors.secondaryColor}}>PRIVATE</Text>
//this is a function that only shows the switch for private addres screen
  switchButton = () => {
    if (this.props.channels[this.props.activeCoin.id].channels.includes("dlight")) {


    const buttons = ['Public', 'Private']
    const { selectedIndex } = this.state

    return(

    <ButtonGroup
      onPress={this.changeIndex}
      buttonStyle={Styles.fullWidthButtonWithPadding}
      selectedIndex={selectedIndex}
      selectedItemColor={Colors.primaryColor}
      buttons={buttons}
      containerStyle={{height: 35}}
      containerStyle = {{
        borderStyle: 'dotted',
        borderWidth: 0
      }}
      />

    )
  } else {
    return null;
 }
}

copyAddressToClipboard = () => {
    Clipboard.setString(this.state.address);
    Alert.alert("Address Copied", "Address copied to clipboard")
  }


//this is a function that shows the private address only in private address mode
dynamicViewingTest = () => {
  const {

    state,
    props,
    validateFormData,
    forceUpdate,
    switchInvoiceCoin,
    switchInvoiceAddress,
    switchInvoiceAddressPrivate,
    copyAddressToClipboard
  } = this;
  const { activeCoinsForUser, rates, displayCurrency } = props;
  const {
    loading,
    showModal,
    verusQRString,
    selectedCoin,
    address,
    errors,
    amountFiat
  } = state;


if(this.state.privateIndex == 0){
  const coinObj = this.state.selectedCoin
  const activeUser = this.props.activeAccount
  //console.log(activeUser.keys.electrum.addresses)

//  var smallpeen = "f"

//   if(this.state.privateAddress.length > 27 ){
  //   smallpeen = this.state.privateAddress.substring(0,27)+"..."
//console.log("dit execute")
//   }else{
//     smallpeen =this.state.privateAddress;
//   }

  var bigpeen = "f"


  if(this.state.address != null){
   if(this.state.address.length > 26 ){
     bigpeen = this.state.address.substring(0,26)+"..."
   }else{
     bigpeen = this.state.address;
   }
 }

//console.log(activeUser.keys[coinObj.id].electrum.addresses)
//strlen($sentence) >= 30 ? exho substr($sentence,0,29)."..." : echo $sentence;
       return(
         <View>
        <View style={Styles.centralRow}>
        <Dropdown
          // TODO: Determine why width must be 85 here, cant be wide block
          containerStyle={{ ...Styles.wideBlock, width: "85%" }}

        /*  if(strlen($sentence) >= 30) {
            echo substr($sentence,0,29)."...";
          } else {
            echo $sentence;
          } */
          labelExtractor={(item, index) => {
            return item.id;
          }}
          valueExtractor={(item, index) => {
            return item.id;
          }}
            data={activeUser.keys[coinObj.id].electrum.addresses}
          onChangeText={(value, index, data) => switchInvoiceAddress(value)}
          textColor={Colors.quinaryColor}
          selectedItemColor={Colors.primaryColor}
          baseColor={Colors.quinaryColor}
          inputStyle={Styles.mediumInlineLink}
          label="Selected address:"
          labelTextStyle={{ fontFamily: "Avenir-Book" }}
          labelFontSize={17}
          value={bigpeen}
          //value={activeUser.keys[coinObj.id].electrum.addresses >= 29? (obj.str).substring(activeUser.keys[coinObj.id].electrum.addresses,0,29) + "..." : activeUser.keys[coinObj.id].electrum.addresses}
          pickerStyle={{ backgroundColor: Colors.tertiaryColor }}
         />
         </View>
        <TouchableOpacity onPress={copyAddressToClipboard}>
          <View style={Styles.centralRow}>
            <View style={{ ...Styles.wideBlock, width: "95%" }} >
        <Input
          labelStyle={Styles.formInputLabel}
          underlineColorAndroid={Colors.quinaryColor}
          editable={false}
          value={address}
          autoCapitalize={"none"}
          autoCorrect={false}
          inputStyle={Styles.mediumInlineLink}
          pointerEvents="none"
          multiline={true}
          label={"Your address:"}
          labelTextStyle={{ fontFamily: "Avenir-Book" }}
          errorMessage={errors.address ? errors.address : null} //dit zijn de gewone errors
        />
        </View>
          </View>
          </TouchableOpacity>
          </View>
        );

}else{



    const coinObj = this.state.selectedCoin
    const activeUser = this.props.activeAccount

   var smallpeen = "f"

    if(this.state.privateAddress.length > 27 ){
      smallpeen = this.state.privateAddress.substring(0,27)+"..."
      console.log("dit execute")
    }else{
      smallpeen =this.state.privateAddress;
    }


    console.log(activeUser.keys[coinObj.id].dlight.addresses)
    return(
    <View >
    <View style={Styles.centralRow}>
    <Dropdown
      // TODO: Determine why width must be 85 here, cant be wide block
      containerStyle={{ ...Styles.wideBlock, width: "85%" }}
      labelExtractor={(item, index) => {
        return item.id;
      }}
      valueExtractor={(item, index) => {
        return item;
      }}
      data={activeUser.keys[coinObj.id].dlight.addresses}
      onChangeText={(value, index, data) => switchInvoiceAddressPrivate(value)}
      textColor={Colors.quinaryColor}
      selectedItemColor={Colors.quinaryColor}
      baseColor={Colors.quinaryColor}
      inputStyle={Styles.mediumInlineLink}
      label="Selected address:"
      labelTextStyle={{ fontFamily: "Avenir-Book" }}
      labelFontSize={17}
      value={smallpeen}
      labelTextStyle={{ ...Styles.textDots}}
      pickerStyle={{ backgroundColor: Colors.tertiaryColor}}
      itemTextStyle={{ fontFamily: "Avenir-Book"}}
    />
    </View>
    <TouchableOpacity onPress={copyAddressToClipboard}>
        <View style={Styles.centralRow}>
        <View style={{ ...Styles.wideBlock, width: "95%" }}  >
    <Input
      labelStyle={Styles.formInputLabel}
      underlineColorAndroid={Colors.quinaryColor}
      editable={false}
      value={this.state.privateAddress}
      autoCapitalize={"none"}
      autoCorrect={false}
      inputStyle={Styles.mediumInlineLink}
      pointerEvents="none"
      multiline={true}
      label={"Your address:"}
      errorMessage={errors.address ? errors.address : null} //dit zijn de gewone errors
    />
    </View>
      </View>
      </TouchableOpacity>
      </View>
    )
  }

}




  render() {
    const _price = this.getPrice()
    const {
      state,
      props,
      validateFormData,
      forceUpdate,
      switchInvoiceCoin,
      copyAddressToClipboard
    } = this;
    const { activeCoinsForUser, rates, displayCurrency } = props;
    const {
      loading,
      showModal,
      verusQRString,
      selectedCoin,
      address,
      errors,
      amountFiat
    } = state;
    const fiatEnabled = rates[selectedCoin.id] && rates[selectedCoin.id][displayCurrency] != null
    const coinObj = this.state.selectedCoin
    const activeUser = this.props.activeAccount


    return (
      <View style={Styles.defaultRoot}>
        <View style={Styles.centralRow}>{this.renderBalanceLabel()}</View>
        <Text style={Styles.greyStripeHeaderWithoutPadding}>
          {"Generate VerusQR Invoice"}
        </Text>
        {this.switchButton()}
        <ScrollView
          style={Styles.fullWidth}
          contentContainerStyle={Styles.horizontalCenterContainer}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={forceUpdate} />
          }
        >


          <QRModal
            animationType="slide"
            transparent={false}
            visible={showModal && verusQRString && verusQRString.length > 0}
            qrString={verusQRString}
            cancel={() => {
              this.setState({ showModal: false });
            }}
          />
          <Dropdown
            // TODO: Determine why width must be 85 here, cant be wide block
            containerStyle={{ ...Styles.wideBlock, width: "85%" }}
            labelExtractor={(item, index) => {
              return item.id;
            }}
            valueExtractor={(item, index) => {
              return item;
            }}
            data={activeCoinsForUser}
            onChangeText={(value, index, data) => switchInvoiceCoin(value)}
            textColor={Colors.quinaryColor}
            selectedItemColor={Colors.quinaryColor}
            baseColor={Colors.quinaryColor}
            label="Selected Coin:"
            labelTextStyle={{ fontFamily: "Avenir-Book" }}
            labelFontSize={17}
            value={selectedCoin}
            pickerStyle={{ backgroundColor: Colors.tertiaryColor }}
            itemTextStyle={{ fontFamily: "Avenir-Book" }}
          />


          {this.dynamicViewingTest()}
          <View style={Styles.wideBlock}>
            <Input
              label={
                <View style={Styles.startRow}>
                  <Text style={Styles.mediumFormInputLabel}>
                    {"Enter an amount in "}
                  </Text>
                  <Text
                    style={
                      fiatEnabled
                        ? Styles.mediumInlineLink
                        : Styles.mediumFormInputLabel
                    }
                    onPress={
                      fiatEnabled
                        ? () => this.setState({ amountFiat: !amountFiat })
                        : () => {}
                    }
                  >
                    {amountFiat ? displayCurrency : selectedCoin.id}
                  </Text>
                </View>
              }
              rightIcon={
                fiatEnabled ? (
                  <Text
                    style={Styles.ghostText}
                    onPress={() => this.setState({ amountFiat: !amountFiat })}
                  >{`~${_price} ${
                    amountFiat ? selectedCoin.id : displayCurrency
                  }`}</Text>
                ) : null
              }
              onChangeText={text => this.setState({ amount: text })}
              keyboardType={"decimal-pad"}
              autoCapitalize="words"
              errorMessage={errors.amount ? errors.amount : null}
            />
          </View>
          <View style={Styles.wideBlock}>
            <Input
              labelStyle={Styles.formInputLabel}
              onChangeText={text => this.setState({ memo: text })}
              autoCapitalize={"none"}
              label={"Enter a note for the receiver (optional):"}
              autoCorrect={false}
              shake={errors.memo}
              errorMessage={errors.memo ? errors.memo : null}
            />
          </View>
          <View style={Styles.wideBlock}>
            <StandardButton
              color={Colors.linkButtonColor}
              title="GENERATE QR"
              onPress={validateFormData}
            />

          </View>
        </ScrollView>
      </View>
    );
  }
}

const mapStateToProps = (state) => {
  const chainTicker = state.coins.activeCoin.id

  return {
    accounts: state.authentication.accounts,
    activeCoin: state.coins.activeCoin,
    activeCoinsForUser: state.coins.activeCoinsForUser,
    activeAccount: state.authentication.activeAccount,
    rates: state.ledger.rates[GENERAL],
    channels: state.settings.coinSettings,
    displayCurrency: state.settings.generalWalletSettings.displayCurrency || USD,
    balances: {
      public: state.ledger.balances[ELECTRUM][chainTicker],
      private: state.ledger.balances[DLIGHT][chainTicker],
      errors: {
        public: state.errors[API_GET_BALANCES][ELECTRUM][chainTicker],
        private: state.errors[API_GET_BALANCES][DLIGHT][chainTicker],
      }
    },
    //needsUpdate: state.ledger.needsUpdate,
  }
};

export default connect(mapStateToProps)(ReceiveCoin);

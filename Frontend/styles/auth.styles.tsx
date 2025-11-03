import { COLORS } from "@/constants/themes";
import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  brandSection: {
    alignItems: "center",
    marginTop: height * 0.1,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "rgba(74, 222, 128, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  appName: {
    fontSize: 42,
    fontWeight: "700",
    fontFamily: "JetBrainsMono-Medium",
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.grey,
    letterSpacing: 1,
    textTransform: "lowercase",
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  illustration: {
    width: width * 0.75,
    height: width * 0.75,
    maxHeight: 280,
  },
  loginSection: {
    width: "100%",
    paddingBottom: 40,
    alignItems: "center",
  },
  googleButton: {

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginBottom: 25,
    width: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10
  },
  facebookButtonText : {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.blue,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.orange,
  },
  termsText: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.grey,
    maxWidth: 280,
  },

  nextStepButton: {
  flexDirection: 'row',          // canh icon và chữ ngang hàng
  justifyContent: 'center',      // căn giữa nội dung
  alignItems: 'center',          // căn giữa theo trục dọc
  bottom: 0,
  width: '100%',
  paddingVertical: 16,
  paddingHorizontal: 24,
  backgroundColor: COLORS.primary,
},

nextStepText: {
  fontSize: 16,
  fontWeight: '600',
  color: COLORS.white,
},

label: {
  width: '95%', 
  alignItems: 'flex-start', 
  paddingHorizontal: 24, 
  marginTop: 15
},
labelText: {
  color: COLORS.secondary,
  fontWeight: 'bold',
  fontSize: 16
},
inputContainer: {
  width: '95%',
  paddingHorizontal: 24,

},
input: {
    marginTop: 10,
    height: 44,
    borderWidth: 1,
    padding: 10,
    borderColor: 'rgba(139, 241, 177, 0.5)',
    borderRadius: 8,
    backgroundColor: "rgba(139, 241, 177, 0.11)",
    shadowColor: "#c3fcc8a6",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 1,
  },
  inputFocused: {
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1.2,
    borderColor: "#5aec35ff",
  },
loginButton: {
  backgroundColor: COLORS.primary,
  paddingVertical: 14,
  borderRadius: 10,
  marginTop: 20,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 3,
  elevation: 3,
  width: '83%'
},
loginButtonText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 16,
},

touchAble:{
  width: '100%',
  height: 'auto',
  justifyContent: 'center',
  alignItems: 'center',

},
dividerContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginVertical: 20,
  width: '83%',
  marginTop: 30
},

line: {
  flex: 1,
  height: 1,
  backgroundColor: '#ccc',
},

dividerText: {
  marginHorizontal: 10,
  color: COLORS.secondary,
  fontSize: 16,
},

otp: {
  marginVertical: 20,
  borderRadius: 10,
  borderColor: COLORS.primary,
  color: COLORS.primary
              
},

  otpSection: {
    alignItems: "center",
    justifyContent: 'center',
    flex : 1
  },

  appNameRegister: {
    fontSize: 38,
    fontWeight: "700",
    fontFamily: "JetBrainsMono-Medium",
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  otpViewTouch:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '83%',
    marginTop: 20
  },
  touchResend: {
    width: '40%',
    height: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    backgroundColor: COLORS.primary
  },

  touchValidate: {
    width: '55%',
    height: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    backgroundColor: COLORS.primary
  },

  otpButton: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },  
  resendButton: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

    touchNoResend: {
    width: '40%',
    height: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.grey,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    backgroundColor: COLORS.grey
  },



  // _________________________________
   header: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: COLORS.primary
  },
  avatarContainer: {
    alignSelf: "center",
    position: "relative",
  },
  avatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 10,
    backgroundColor: COLORS.orange,
    borderRadius: 15,
    padding: 5,
  },
  name: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },


  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:COLORS.shadow,
  },
  modalContainer: {
    backgroundColor:COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: 300,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  option: {
    alignItems: "center",
  },
  optionText: {
    marginTop: 5,
    color: COLORS.surface,
  },


  skip: {
    width: '40%',
    height: 'auto',
    // justifyContent: 'center',
    // alignItems: 'center',
    // borderWidth: 1,
    // borderColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 15,

  },
  skipText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  inputWrapper: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: COLORS.primary,
  borderRadius: 12,
  paddingHorizontal: 10,
  marginVertical: 5,
  backgroundColor: COLORS.white,
},
inputIcon: {
  marginRight: 6,
},
inputInner: {
  flex: 1,
  paddingVertical: 10,
  fontSize: 16,
  color: COLORS.primary,
},
searchSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
},
searchIcon: {
    padding: 10,
},

inputs: {
    flex: 1,
    paddingTop: 10,
    paddingRight: 10,
    paddingBottom: 10,
    paddingLeft: 0,
    backgroundColor: '#fff',
    color: '#424242',
},
});
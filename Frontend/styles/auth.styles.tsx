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
    marginTop: height * 0.05,
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: `${COLORS.primary}26`, // rgba với opacity 15%
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: "JetBrainsMono-Medium",
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginBottom: 32,
    textAlign: 'center',
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
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    width: "85%",
    borderWidth: 1.5,
    borderColor: COLORS.lightGrey,
    shadowColor: COLORS.shadow || "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '85%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    alignSelf: 'center',
    marginTop: 20,
  },

nextStepText: {
  fontSize: 16,
  fontWeight: '700',
  color: COLORS.white,
  letterSpacing: 0.5,
},

label: {
  width: '85%', 
  alignItems: 'flex-start', 
  marginTop: 16,
  marginBottom: 4,
},
labelText: {
  color: COLORS.darkGrey,
  fontWeight: '600',
  fontSize: 15,
  marginLeft: 4,
},
inputContainer: {
  width: '85%',
  marginBottom: 4,
},
input: {
    marginTop: 10,
    height: 48,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderColor: `${COLORS.primary}30`, // Lighter border
    borderRadius: 10,
    backgroundColor: COLORS.white,
    fontSize: 15,
    color: COLORS.darkGrey,
    shadowColor: COLORS.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  inputFocused: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    backgroundColor: COLORS.white, // Keep white background
    shadowColor: COLORS.primary, // Purple shadow when focused
  },
loginButton: {
  backgroundColor: COLORS.primary,
  paddingVertical: 16,
  borderRadius: 12,
  marginTop: 24,
  alignItems: 'center',
  shadowColor: COLORS.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 5,
  width: '85%'
},
loginButtonText: {
  color: COLORS.white,
  fontWeight: '700',
  fontSize: 16,
  letterSpacing: 0.5,
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
  marginVertical: 24,
  width: '85%',
  marginTop: 32
},

line: {
  flex: 1,
  height: 1,
  backgroundColor: COLORS.lightGrey,
},

dividerText: {
    marginHorizontal: 12,
    color: COLORS.grey,
    fontSize: 14,
    fontWeight: '500',
},
linkContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '85%',
  marginTop: 16,
  marginBottom: 8,
},
linkText: {
  color: COLORS.primary,
  fontSize: 14,
  fontWeight: '500',
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
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "JetBrainsMono-Medium",
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginBottom: 32,
    textAlign: 'center',
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
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: COLORS.shadow || "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: COLORS.primary
  },

  touchValidate: {
    width: '55%',
    height: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: COLORS.primary
  },

  otpButton: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },  
  resendButton: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  verifySubtext: {
    color: COLORS.grey,
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },

    touchNoResend: {
    width: '40%',
    height: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.lightGrey,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  resendButtonDisabled: {
    color: COLORS.grey,
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5,
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
    borderWidth: 1.5,
    borderColor: `${COLORS.primary}30`, // Lighter border
    borderRadius: 10,
    paddingHorizontal: 14,
    marginVertical: 6,
    backgroundColor: COLORS.white,
    minHeight: 48,
    width: '85%',
    alignSelf: 'center',
    shadowColor: COLORS.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputInner: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.darkGrey,
    fontWeight: '400',
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
    backgroundColor: COLORS.white,
    color: COLORS.darkGrey,
},
});
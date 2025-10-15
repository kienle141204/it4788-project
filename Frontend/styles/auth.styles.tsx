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

});
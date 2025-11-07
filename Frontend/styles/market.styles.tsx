import { COLORS } from "@/constants/themes";
import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const marketStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 10,
  },
  title: { fontSize: 20, fontWeight: "600" },
  iconGroup: { flexDirection: "row", gap: 10 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    margin: 16,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  searchInput: { flex: 1, marginLeft: 6 },
  categoryBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 15,
    height: 35
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    margin: 8,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    elevation: 2,
  },
  image: { width: 80, height: 80, resizeMode: "contain" },
  name: { fontSize: 13, textAlign: "center", marginVertical: 5 },
  price: { fontWeight: "bold", color: "#f97316" },
  addBtn: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 6,
  },
  addText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center", // căn giữa theo chiều ngang
    alignItems: "center",      // căn giữa theo chiều dọc
    marginBottom: 20,
    gap: 8,
    width: '80%',
    alignSelf: 'center', 
    marginHorizontal: 20,      // căn giữa chính nó trong View cha
    marginVertical: 20
  },

  pageButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activePage: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
});
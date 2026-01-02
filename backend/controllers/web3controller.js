const web3Service=require("../services/web3")


exports.web3Status = async (req, res) => {
  const data = await web3Service.checkWeb3Health();
  res.json(data);
};

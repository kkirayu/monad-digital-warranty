import { ethers } from "hardhat";

async function main() {
    console.log("Memulai deployment kontrak...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying applying to Default Admin:", deployer.address);

    const DigitalWarranty = await ethers.getContractFactory("DigitalWarranty");
    const warranty = await DigitalWarranty.deploy(deployer.address);
    await warranty.waitForDeployment();
    const address = await warranty.getAddress();
    console.log(`Kontrak berhasil di-deploy ke alamat: ${address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

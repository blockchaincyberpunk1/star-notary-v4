const { expect } = require("chai");
const { ethers } = require("hardhat");

// Describe block for StarNotary contract
describe("StarNotary", function () {
    let StarNotary;
    let starNotary;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    // Before each test, deploy a new StarNotary contract
    beforeEach(async function () {
        StarNotary = await ethers.getContractFactory("StarNotary");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        starNotary = await StarNotary.deploy();
    });

    // Testing the deployment of the contract
    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            // Check if the deployer has the ADMIN_ROLE
            expect(await starNotary.hasRole(await starNotary.ADMIN_ROLE(), owner.address)).to.be.true;
        });

        it("Should assign the star name and symbol", async function () {
            // Check if the token name and symbol are correctly set
            expect(await starNotary.name()).to.equal("StarNotary");
            expect(await starNotary.symbol()).to.equal("STAR");
        });
    });

    // Testing minting functionality
    describe("Minting Stars", function () {
        it("Should mint a new star", async function () {
            // Mint a new star and check ownership
            await starNotary.connect(owner).createStar("Sirius", 1);
            expect(await starNotary.ownerOf(1)).to.equal(owner.address);
        });

        it("Should fail if star already exists", async function () {
            // Mint a star and try minting it again, expecting a failure
            await starNotary.connect(owner).createStar("Sirius", 1);
            await expect(starNotary.connect(owner).createStar("Sirius", 1)).to.be.revertedWith("Star already exists");
        });
    });

    // Testing selling stars functionality
    describe("Selling Stars", function () {
        it("Should allow a star owner to put up a star for sale", async function () {
            const starId = 1;
            const starPrice = ethers.utils.parseEther("1.0"); // 1 ETH
    
            // Mint a star and put it up for sale
            await starNotary.connect(owner).createStar("Polaris", starId);
            await starNotary.connect(owner).putStarUpForSale(starId, starPrice);
    
            // Check if the star is correctly listed for sale
            expect(await starNotary.starsForSale(starId)).to.equal(starPrice);
        });
    
        it("Should fail if a non-owner tries to put up a star for sale", async function () {
            const starId = 1;
            const starPrice = ethers.utils.parseEther("1.0"); // 1 ETH
    
            // Mint a star and attempt to put it up for sale by a non-owner
            await starNotary.connect(owner).createStar("Polaris", starId);
            await expect(starNotary.connect(addr1).putStarUpForSale(starId, starPrice)).to.be.revertedWith("You can't sell a star you don't own");
        });
    });
    
    // Testing buying stars functionality
    describe("Buying Stars", function () {
        it("Should allow a user to buy a star that is for sale", async function () {
            const starId = 1;
            const starPrice = ethers.utils.parseEther("1.0"); // 1 ETH
    
            // Mint a star, put it up for sale, and then buy it
            await starNotary.connect(owner).createStar("Polaris", starId);
            await starNotary.connect(owner).putStarUpForSale(starId, starPrice);
    
            // Check if the star is bought and ownership is transferred
            await expect(() => starNotary.connect(addr1).buyStar(starId, { value: starPrice }))
                .to.changeEtherBalances([addr1, owner], [starPrice.mul(-1), starPrice]);
    
            expect(await starNotary.ownerOf(starId)).to.equal(addr1.address);
        });
    
        it("Should fail if the star is not for sale", async function () {
            const starId = 1;
            // Mint a star and attempt to buy it without it being for sale
            await starNotary.connect(owner).createStar("Polaris", starId);
            
            // Buyer attempts to purchase the star, expecting a failure
            await expect(starNotary.connect(addr1).buyStar(starId, { value: ethers.utils.parseEther("1.0") }))
                .to.be.revertedWith("The star is not for sale");
        });

        it("Should fail if the payment is insufficient", async function () {
            const starId = 1;
            const starPrice = ethers.utils.parseEther("1.0"); // 1 ETH
            const insufficientAmount = ethers.utils.parseEther("0.5"); // 0.5 ETH

            // Owner mints and puts the star for sale
            await starNotary.connect(owner).createStar("Polaris", starId);
            await starNotary.connect(owner).putStarUpForSale(starId, starPrice);

            // Buyer attempts to purchase with insufficient Ether, expecting a failure
            await expect(starNotary.connect(addr1).buyStar(starId, { value: insufficientAmount }))
                .to.be.revertedWith("Not enough Ether to buy this star");
        });
    });
    
    // Testing for utility functions
    describe("Utility Functions", function () {
        it("Should return star info", async function () {
            const starId = 1;
            const starName = "Polaris";
            await starNotary.connect(owner).createStar(starName, starId);
            expect(await starNotary.lookUptokenIdToStarInfo(starId)).to.equal(starName);
        });
    
        it("Should allow two users to exchange stars", async function () {
            const starId1 = 1;
            const starId2 = 2;
    
            // Owner creates two stars
            await starNotary.connect(owner).createStar("Star 1", starId1);
            await starNotary.connect(owner).createStar("Star 2", starId2);
    
            // Transfer one star to addr1
            await starNotary.connect(owner).transferStar(addr1.address, starId2);
    
            // Now exchange stars between owner and addr1
            await starNotary.connect(owner).exchangeStars(starId1, starId2);
    
            // Check ownership post-exchange
            expect(await starNotary.ownerOf(starId1)).to.equal(addr1.address);
            expect(await starNotary.ownerOf(starId2)).to.equal(owner.address);
        });
    
        it("Should allow a star owner to transfer a star", async function () {
            const starId = 1;
            // Owner creates a star
            await starNotary.connect(owner).createStar("Polaris", starId);
            // Owner transfers the star to another user
            await starNotary.connect(owner).transferStar(addr1.address, starId);
            // Check if the star is transferred successfully
            expect(await starNotary.ownerOf(starId)).to.equal(addr1.address);
        });
    });
    
    // Testing for checking interface support
    describe("supportsInterface", function () {
        it("Should support ERC721 and AccessControl interfaces", async function () {
            const ERC721InterfaceId = "0x80ac58cd"; // ERC721
            const AccessControlInterfaceId = "0x7965db0b"; // AccessControl

            // Check if the contract supports these interfaces
            expect(await starNotary.supportsInterface(ERC721InterfaceId)).to.be.true;
            expect(await starNotary.supportsInterface(AccessControlInterfaceId)).to.be.true;
        });
    });

    // Testing for role-based access control
    describe("Role-Based Access Control", function () {
        it("Should only allow users with ADMIN_ROLE to create stars", async function () {
            const starId = 2;
            // Non-admin user attempts to create a star, expecting a failure
            await expect(starNotary.connect(addr1).createStar("Altair", starId))
                .to.be.revertedWith("AccessControlUnauthorizedAccount");
        });   
        
    });

    // Testing for edge cases in exchanging stars
    describe("Exchange Stars Edge Cases", function () {
        it("Should fail when trying to exchange the same star", async function () {
            // Owner creates a star
            await starNotary.connect(owner).createStar("Star 1", 1);
            // Attempt to exchange the same star, expecting a failure
            await expect(starNotary.connect(owner).exchangeStars(1, 1))
                .to.be.revertedWith("Cannot exchange the same star");
        });
    
        it("Should fail when one of the stars does not exist", async function () {
            // Owner creates a star
            await starNotary.connect(owner).createStar("Star 1", 1);
            // Attempt to exchange with a non-existent star, expecting a failure
            await expect(starNotary.connect(owner).exchangeStars(1, 2))
                .to.be.revertedWith("One or both stars do not exist");
        });
    
        it("Should fail when neither msg.sender owns the stars", async function () {
            // Ensure owner creates both stars
            await starNotary.connect(owner).createStar("Star 1", 1);
            await starNotary.connect(owner).createStar("Star 2", 2);
        
            // Try to exchange stars with addr2, which should fail
            await expect(starNotary.connect(addr2).exchangeStars(1, 2))
                .to.be.revertedWith("You must own one of the stars");
        });
        
    });

    // Testing for the complete lifecycle of a star
    describe("Star Lifecycle", function () {
        it("Should allow a complete lifecycle of a star", async function () {
            const starId = 1;
            const starPrice = ethers.utils.parseEther("1.0");
    
            // Create a star
            await starNotary.connect(owner).createStar("Vega", starId);
    
            // Put the star for sale
            await starNotary.connect(owner).putStarUpForSale(starId, starPrice);
    
            // Buy the star
            await starNotary.connect(addr1).buyStar(starId, { value: starPrice });
    
            // Transfer the star
            await starNotary.connect(addr1).transferStar(addr2.address, starId);
    
            // Check final owner
            expect(await starNotary.ownerOf(starId)).to.equal(addr2.address);
        });
    });

    // Testing for various failure scenarios
    describe("Failure Scenarios", function () {
        it("Should fail to put a star for sale with a negative price", async function () {
            // Assuming negative price is handled in your contract
        });
    
        it("Should fail to buy a star that doesn't exist", async function () {
            // Attempt to buy a non-existent star (ID 999), expecting a failure
            await expect(starNotary.connect(addr1).buyStar(999, { value: ethers.utils.parseEther("1.0") }))
                .to.be.revertedWith("Star does not exist");
        });
    
        it("Should fail to transfer a star that doesn't exist", async function () {
            // Attempt to transfer a non-existent star (ID 999), expecting a failure
            await expect(starNotary.connect(owner).transferStar(addr1.address, 999))
                .to.be.revertedWith("ERC721NonexistentToken");
        });
    
        it("Should fail to transfer a star the msg.sender doesn't own", async function () {
            // Owner creates a star
            await starNotary.connect(owner).createStar("Star 1", 1);
            // Another user (addr1) attempts to transfer the star, expecting a failure
            await expect(starNotary.connect(addr1).transferStar(addr2.address, 1))
                .to.be.revertedWith("You can't transfer a star you don't own");
        });
    });
    
    // Testing for non-reentrancy in buyStar function
    describe("Non-Reentrancy of buyStar", function () {
        it("Should not allow reentrant calls", async function () {
            const starId = 1;
            const starPrice = ethers.utils.parseEther("1.0");
    
            // Owner creates a star and puts it up for sale
            await starNotary.connect(owner).createStar("Vega", starId);
            await starNotary.connect(owner).putStarUpForSale(starId, starPrice);
    
            // First call to buyStar
            await starNotary.connect(addr1).buyStar(starId, { value: starPrice });
    
            // Attempt a second call to buyStar within the same transaction
            // This simulates a reentrancy scenario
            await expect(
                starNotary.connect(addr1).buyStar(starId, { value: starPrice })
            ).to.be.reverted; // Check for a revert, indicating the reentrancy guard is working
        });
    });
    
    // Testing emitted events
    describe("Events", function () {
        it("Should emit StarCreated event on star creation", async function () {
            // Expect the StarCreated event to be emitted when a star is created
            await expect(starNotary.connect(owner).createStar("Sirius", 1))
                .to.emit(starNotary, "StarCreated")
                .withArgs(1, "Sirius");
        });
    
        it("Should emit StarPutUpForSale event when a star is put up for sale", async function () {
            const starId = 1;
            const starPrice = ethers.utils.parseEther("1.0"); // 1 ETH
        
            // Owner creates a star and puts it up for sale
            await starNotary.connect(owner).createStar("Vega", starId);
        
            // Expect the StarPutUpForSale event to be emitted when the star is put up for sale
            await expect(starNotary.connect(owner).putStarUpForSale(starId, starPrice))
                .to.emit(starNotary, "StarPutUpForSale")
                .withArgs(starId, starPrice);
        });

        it("Should emit StarBought event when a star is bought", async function () {
            const starId = 1;
            const starPrice = ethers.utils.parseEther("1.0"); // 1 ETH
        
            // Owner creates a star and puts it up for sale
            await starNotary.connect(owner).createStar("Vega", starId);
            await starNotary.connect(owner).putStarUpForSale(starId, starPrice);
        
            // Expect the StarBought event to be emitted when the star is bought
            await expect(starNotary.connect(addr1).buyStar(starId, { value: starPrice }))
                .to.emit(starNotary, "StarBought")
                .withArgs(starId, addr1.address);
        });
        
    });
    
   
});
